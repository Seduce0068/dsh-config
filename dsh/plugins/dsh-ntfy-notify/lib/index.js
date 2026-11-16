/**
 * dsh-ntfy-notify — Host half.
 *
 * Turns DeepSeek Harness host events into ntfy publishes so a phone receives a
 * push with no browser open:
 *
 *  - `approval/request`         → an approval is waiting for the human
 *  - `ask_user_question` call   → a question is waiting for the human
 *  - `turn/end` on a root session → a turn finished (or failed)
 *
 * The browser half (`./client`) reports the away state over
 * `POST /api/ntfy-notify/presence` so pushes stay quiet while the human is
 * actually looking at that session.
 *
 * Every host listener is observational: the approval waterfall always calls
 * `next()`, and a failed publish only writes a log line.
 *
 * @module dsh-ntfy-notify
 */

import z from '@deepseek-ai/schemastery'

/** Services this plugin reads. */
export const inject = ['webServer', 'sessions']

/** Validation for the Cordis row's `config`. */
export const Config = z.object({
  server: z.string().default('https://ntfy.sh'),
  topic: z.string().default(''),
  token: z.string().default(''),
  clickUrl: z.string().default(''),
  sound: z.boolean().default(true),
  notifyApproval: z.boolean().default(true),
  notifyQuestion: z.boolean().default(true),
  notifyTurnComplete: z.boolean().default(true),
  // ntfy priority per event kind: min | low | default | high | max.
  approvalPriority: z.string().default('max'),
  questionPriority: z.string().default('max'),
  turnPriority: z.string().default('high'),
})

const CONFIG_DEFAULTS = {
  server: 'https://ntfy.sh',
  topic: '',
  token: '',
  clickUrl: '',
  sound: true,
  notifyApproval: true,
  notifyQuestion: true,
  notifyTurnComplete: true,
  approvalPriority: 'max',
  questionPriority: 'max',
  turnPriority: 'high',
}

/** How long a browser's away/foreground report stays valid without a refresh. */
const PRESENCE_TTL_MS = 120_000
/** A push key is remembered this long so a reconnect cannot repeat it. */
const PUSHED_TTL_MS = 30 * 60 * 1000
/** Pending notifications expire on the phone after this long. */
const WAIT_TIMEOUT_SECONDS = 30 * 60
/** ntfy rejects bodies over 4096 bytes; stay well under it. */
const MAX_BODY_CHARS = 600
/** Request timeout for one publish. */
const PUBLISH_TIMEOUT_MS = 10_000

/* --------------------------------------------------------------- utilities */

const pad = (n) => String(n).padStart(2, '0')

/** Local wall-clock stamp shown in notification bodies. */
function stamp(now = Date.now()) {
  const d = new Date(now)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Collapse whitespace and cut to `max` characters. */
function clip(text, max = MAX_BODY_CHARS) {
  const flat = String(text ?? '')
    .replace(/\s+/gu, ' ')
    .trim()
  if (flat.length <= max) return flat
  return `${flat.slice(0, Math.max(0, max - 1))}…`
}

/** Hide the middle of a session id so a notification stays readable. */
function shortSession(sessionId) {
  const id = typeof sessionId === 'string' ? sessionId : ''
  if (id === '') return 'セッション'
  return id.length <= 20 ? id : `${id.slice(0, 8)}…${id.slice(-4)}`
}

function resolveConfig(given) {
  const out = { ...CONFIG_DEFAULTS }
  for (const key of Object.keys(CONFIG_DEFAULTS)) {
    const value = given?.[key]
    if (value === undefined || value === null) continue
    out[key] = typeof value === 'string' ? value.trim() : value
  }
  return out
}

/** Logger that stays quiet unless DSH_NTFY_DEBUG is set. */
function createLog(ctx) {
  const debug = process.env.DSH_NTFY_DEBUG === '1'
  const sink = (level, line) => {
    if (!debug && level === 'debug') return
    try {
      ctx.logger?.(level === 'debug' ? 'info' : level)?.(`[ntfy-notify] ${line}`)
    } catch {
      if (debug) process.stderr.write(`[ntfy-notify] ${line}\n`)
    }
  }
  return {
    info: (line) => sink('info', line),
    warn: (line) => sink('warn', line),
    debug: (line) => sink('debug', line),
  }
}

/**
 * Encode a header value that may hold non-ASCII text as an RFC 2047 encoded
 * word. Node's fetch only accepts ByteString header values, and ntfy stores a
 * `Title` header verbatim, so the phone would otherwise show literal `%E6..`
 * or `=?UTF-8?B?..` text. RFC 2047 also requires the encoded word to sit on a
 * line of its own, which becomes the `X-Title` header ntfy documents for
 * non-ASCII titles.
 * @param text - the human-facing string.
 * @param kind - header kind, kept for call-site readability.
 * @returns the same text when it is plain ASCII.
 */
function encodeHeaderWord(text, kind) {
  void kind
  // eslint-disable-next-line no-control-regex
  if (!/[^\x00-\x7F]/u.test(text)) return text
  const encoded = Buffer.from(text, 'utf8').toString('base64')
  return `=?UTF-8?B?${encoded}?=`
}

/**
 * Build the title headers: ASCII titles ride `Title`, non-ASCII ones ride
 * `X-Title` as an RFC 2047 encoded word, which the ntfy apps decode back.
 * @param text - the notification title.
 * @returns the headers to merge into the request.
 */
function titleHeader(text) {
  // eslint-disable-next-line no-control-regex
  if (!/[^\x00-\x7F]/u.test(text)) return { Title: text }
  return { 'X-Title': `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=` }
}

/* ---------------------------------------------------------------- the plugin */

/**
 * Mount the notifier.
 * @param ctx - Host context carrying `webServer` and `sessions`.
 * @param config - the Cordis row's config.
 */
export function apply(ctx, config) {
  const cfg = resolveConfig(config)
  const log = createLog(ctx)
  const base = cfg.server.replace(/\/+$/u, '')
  // X-Click target when the phone taps the notification. Defaults to the ntfy
  // server (previous behaviour); set `clickUrl` in the profile row to open DSH.
  const clickUrl = cfg.clickUrl !== '' ? cfg.clickUrl.replace(/\/+$/u, '') : base

  if (cfg.topic === '') {
    log.warn('no topic configured — add a `topic` to the ntfy-notify row in the profile patch; pushes are disabled')
  }

  const endpoint = cfg.topic === '' ? '' : `${base}/${encodeURIComponent(cfg.topic)}`

  /* ------------------------------------------------------------- presence */

  /** Per-session away/foreground facts reported by the browser half. */
  const presence = new Map()
  /** Sessions whose current turn was triggered by an automatic goal round. */
  const goalTurns = new Set()
  let mainSessionId

  const touch = (sessionId, patch) => {
    if (typeof sessionId !== 'string' || sessionId === '') return
    const previous = presence.get(sessionId) ?? {}
    presence.set(sessionId, { ...previous, ...patch, at: Date.now() })
  }

  const prunePresence = (now = Date.now()) => {
    for (const [id, record] of presence) {
      if (now - (record.at ?? 0) > PRESENCE_TTL_MS) presence.delete(id)
    }
  }

  /**
   * True while a browser is showing this session: either it is the main view,
   * or a page reported it while hidden (pip/background tab still keeps it open).
   */
  const watching = (sessionId) => {
    const now = Date.now()
    prunePresence(now)
    const record = presence.get(sessionId)
    if (record === undefined) return false
    if (mainSessionId === sessionId && now - (record.mainAt ?? 0) <= PRESENCE_TTL_MS) return true
    return false
  }

  /** True while any DSH page reports itself in the foreground. */
  const anyForeground = () => {
    const now = Date.now()
    prunePresence(now)
    for (const record of presence.values()) {
      if (now - (record.foregroundAt ?? 0) <= PRESENCE_TTL_MS) return true
    }
    return false
  }

  /* --------------------------------------------------------- push dedupe */

  const pushed = new Map()

  /** Question pushes still waiting for an answer, so the settlement can retract them. */
  const pendingQuestions = new Set()

  /** Sessions whose completion push is still the latest thing the phone shows. */
  const turnNotified = new Set()

  const seenRecently = (key) => {
    const until = pushed.get(key)
    if (until === undefined) return false
    if (until <= Date.now()) {
      pushed.delete(key)
      return false
    }
    return true
  }

  const remember = (key) => {
    pushed.set(key, Date.now() + PUSHED_TTL_MS)
    if (pushed.size > 500) {
      const now = Date.now()
      for (const [candidate, until] of pushed) if (until <= now) pushed.delete(candidate)
    }
  }

  /* ----------------------------------------------------------- publishing */

  /** Publish one push notification to ntfy. Resolves false on any failure. */
  async function publish(kind, title, body, key) {
    if (endpoint === '') return false
    const headers = {
      // ntfy stores `Title` verbatim but decodes `X-Title` (see encodeHeaderWord).
      ...titleHeader(clip(title, 120)),
      Priority: cfg[`${kind}Priority`] ?? (kind === 'turn' ? 'high' : 'max'),
      Tags: kind === 'approval' ? 'warning' : kind === 'question' ? 'question' : 'white_check_mark',
      Click: clickUrl,
    }
    if (cfg.sound) headers['X-Sound'] = 'default'
    if (key !== undefined) headers['X-Tag'] = key
    if (cfg.token !== '') headers.Authorization = `Bearer ${cfg.token}`
    if (kind !== 'turn') {
      headers['X-Cache'] = 'no'
      headers['X-Expires'] = String(WAIT_TIMEOUT_SECONDS * 60)
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PUBLISH_TIMEOUT_MS)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: clip(body) || clip(title),
        signal: controller.signal,
      })
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        log.warn(`publish ${kind} failed: HTTP ${response.status} ${clip(text, 200)}`)
        return false
      }
      log.debug(`published ${kind} key=${key ?? '-'}`)
      return true
    } catch (error) {
      log.warn(`publish ${kind} failed: ${String(error?.message ?? error)}`)
      return false
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Retract every notification already delivered on the topic.
   *
   * A waiting notification is published with `X-Cache: no` so it never grows the
   * replay cache, but the phone keeps showing whatever it already received: an
   * answered approval, a hidden question, and a busy turn would otherwise stay
   * in the shade and keep chattering on an urgent channel. `X-Clear` tells the
   * subscribed apps to drop everything they show for this topic.
   *
   * @param reason - short diagnostic label for the log.
   */
  async function clearRemote(reason) {
    if (endpoint === '') return
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PUBLISH_TIMEOUT_MS)
    try {
      const headers = { 'X-Clear': 'true' }
      if (cfg.token !== '') headers.Authorization = `Bearer ${cfg.token}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        signal: controller.signal,
      })
      if (!response.ok) log.warn(`clear (${reason}) failed: HTTP ${response.status}`)
      else log.debug(`cleared after ${reason}`)
    } catch (error) {
      log.warn(`clear (${reason}) failed: ${String(error?.message ?? error)}`)
    } finally {
      clearTimeout(timer)
    }
  }

  /* ------------------------------------------------------------- approvals */

  if (cfg.notifyApproval) {
    ctx.on('approval/request', async (req, next) => {
      try {
        const sessionId = req?.agent?.session?.id
        if (!watching(sessionId)) {
          const key = `approval:${sessionId ?? '-'}:${String(req?.callId ?? req?.toolName ?? 'request')}`
          if (!seenRecently(key)) {
            remember(key)
            const tool = req?.toolName ?? 'tool'
            const reason = clip(req?.displayReason?.en ?? req?.reason ?? '', 200)
            void publish(
              'approval',
              `承認待ち: ${tool}`,
              `${reason === '' ? 'ツールの実行に承認が必要です' : reason} · ${shortSession(sessionId)} (${stamp()})`,
              key,
            )
          }
        }
      } catch (error) {
        log.warn(`approval hook failed: ${String(error?.message ?? error)}`)
      }
      // The decision is made either way: drop the waiting push instead of
      // leaving it in the notification shade.
      const outcome = await next()
      if (outcome !== 'cancelled') void clearRemote('approval')
      return outcome
    })
  }

  /* --------------------------------------------------- questions & turns */

  ctx.on('session/event', (session, event) => {
    try {
      if (event === undefined || event === null) return
      const sessionId = session?.id
      const type = event.type
      if (type === 'user/message' && sessionId !== undefined && sessionId !== null) {
        // The marker describes the turn that is about to run. A human message
        // replaces a goal marker left behind by an aborted goal, so a later
        // manual turn is never mistaken for an automatic round.
        if (event.data?.source?.kind === 'goal') goalTurns.add(sessionId)
        else goalTurns.delete(sessionId)
      }

      if (type === 'tool/call' && cfg.notifyQuestion) {
        const data = event.data ?? {}
        const call = data.call ?? data
        if (call?.name !== 'ask_user_question') return
        if (watching(sessionId)) return
        const key = `question:${sessionId ?? '-'}:${String(call?.callId ?? event.seq ?? '')}`
        if (seenRecently(key)) return
        remember(key)
        const questions = call?.arguments?.questions
        const first = Array.isArray(questions) ? questions[0] : undefined
        const question = clip(first?.question ?? '', 200)
        void publish(
          'question',
          `質問待ち: ${shortSession(sessionId)}`,
          `${question === '' ? 'エージェントが回答を待っています' : question} (${stamp()})`,
          key,
        )
        pendingQuestions.add(key)
        return
      }

      // The ask_user_question call settled (answered, skipped, or cancelled);
      // retract the waiting push so the shade does not keep chiming.
      if (type === 'tool/result') {
        const data = event.data ?? {}
        const result = data.result ?? data
        const callId = result?.callId ?? data.callId
        if (callId === undefined) return
        const key = `question:${sessionId ?? '-'}:${String(callId)}`
        if (!pendingQuestions.delete(key)) return
        void clearRemote('question')
        return
      }

      // Read the goal marker before clearing it: every turn end consumes the
      // marker for its own turn, and the check below must still see it.
      const fromGoal = type === 'turn/end' && goalTurns.has(sessionId)
      if (type === 'turn/end') goalTurns.delete(sessionId)
      if (type === 'turn/end' && cfg.notifyTurnComplete) {
        // A delegated child finishing is noise on the phone; its parent reports.
        const parent = session?.parentSessionId
        if (parent !== undefined && parent !== null) return
        // Goal rounds fire turns automatically; notifying each one is noise.
        if (fromGoal) return
        // ユーザー自身が中断ボタンを押した場合は通知しない。
        if (event.data?.reason?.reason?.kind === 'user') return
        if (anyForeground()) return
        const data = event.data ?? {}
        const reasonKind = data.reason?.kind ?? 'completed'
        const turn = data.turn ?? '?'
        const key = `turn:${sessionId ?? '-'}:${String(event.seq ?? turn)}`
        if (seenRecently(key)) return
        remember(key)
        const failed = reasonKind === 'error' || reasonKind === 'max-tokens'
        void publish(
          'turn',
          `${failed ? 'ターン失敗' : 'ターン完了'}: ${shortSession(sessionId)}`,
          failed
            ? `ターン ${turn} が ${reasonKind} で終了しました (${stamp()})`
            : `ターン ${turn} が完了しました (${stamp()})`,
          key,
        )
        turnNotified.add(sessionId ?? '')
        return
      }

      // A new turn on that session means the completion push is stale now.
      if (type === 'turn/start' && turnNotified.has(sessionId ?? '')) {
        turnNotified.delete(sessionId ?? '')
        void clearRemote('turn')
      }
    } catch (error) {
      log.warn(`session hook failed: ${String(error?.message ?? error)}`)
    }
  })

  /* ------------------------------------------------ browser presence route */

  const disposeRoute = ctx.webServer.register({
    kind: 'exact',
    path: '/api/ntfy-notify/presence',
    handler: (req, res) => {
      res.setHeader('Cache-Control', 'no-store')
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.setHeader('Allow', 'POST')
        res.end('method not allowed')
        return
      }
      let raw = ''
      let size = 0
      req.on('data', (chunk) => {
        size += chunk.length
        if (size > 8192) {
          req.destroy()
          return
        }
        raw += chunk
      })
      req.on('end', () => {
        try {
          const report = JSON.parse(raw === '' ? '{}' : raw)
          const sessionId = typeof report.sessionId === 'string' ? report.sessionId : ''
          const foreground = report.foreground === true
          const main = report.main === true
          touch(sessionId, {
            awayAt: foreground ? 0 : Date.now(),
            mainAt: main ? Date.now() : 0,
            foregroundAt: foreground ? Date.now() : 0,
          })
          // A page that reports itself as no longer main (or another page taking
          // over the main view) must not leave a stale "watching" session behind.
          if (main) {
            if (sessionId !== '') mainSessionId = sessionId
            else mainSessionId = undefined
          }
        } catch (error) {
          log.warn(`presence report ignored: ${String(error?.message ?? error)}`)
        }
        res.statusCode = 204
        res.end()
      })
      req.on('error', () => {
        try {
          res.destroy()
        } catch {
          // The socket is already gone.
        }
      })
    },
  })

  ctx.on('dispose', () => {
    try {
      disposeRoute()
    } catch {
      // The server may already be gone during process teardown.
    }
  })

  log.info(`ntfy notifier ready (server=${base}, topic=${cfg.topic === '' ? '<unset>' : cfg.topic})`)
}

export default { name: 'dsh-ntfy-notify', inject, Config, apply }
