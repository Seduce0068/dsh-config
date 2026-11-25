import z from '@deepseek-ai/schemastery'
/**
 * @local/dsh-auto-preset — Host-only Cordis plugin.
 *
 * Selects an agent preset exactly once, on a blank session, from the first
 * `user/message` event. The decision is rule based and lives in the pure
 * `decidePreset()` function below so it can be unit tested without a Host.
 */

/**
 * The design declares `inject = ['agentPresets', 'session']`. This bundle
 * declares only resolvable services: DSH exposes the session store as
 * `sessions` (dsh-session/src/index.ts:1172) and an injected name with no
 * matching implementation leaves the fiber PENDING
 * (cordis/src/fiber.ts:619-623). Session-derived services are read with
 * `ctx.get(...)` inside `apply`, as the design's optional-dependency rule
 * prescribes.
 */
export const inject = ['agentPresets']

const STANDARD = 'standard'
const PTC = 'ptc'
const CREATOR = 'creator'
const ALL_PRESETS = [STANDARD, PTC, CREATOR]

/** Every PTC rule id must match before PTC is eligible (3-group ALL gate). */
export const PTC_GROUPS = ['ptc-bulk-target', 'ptc-aggregate-verb', 'ptc-structured-output']

/**
 * Default scoring rules. `group` is one of
 * ptc-positive / creator-positive / standard-positive / negative-gate.
 * A pattern is matched case-insensitively as a substring, or as a RegExp when
 * written between slashes (e.g. "/\\bfix\\b/").
 */
export const DEFAULT_RULES = [
  {
    id: 'ptc-bulk-target',
    group: 'ptc-positive',
    weight: 30,
    patterns: [
      '複数ファイル', '複数項目', '複数件', '全ファイル', '全json', 'すべてのjson', '各ファイル', 'ディレクトリ内', '一括', '横断', '一掃',
      'まとめて', 'プロジェクト全体', 'リポジトリ全体',
      'multiple files', 'all files', 'across files', 'every file',
      'bulk', 'batch', 'repository-wide',
    ],
  },
  {
    id: 'ptc-aggregate-verb',
    group: 'ptc-positive',
    weight: 30,
    patterns: [
      '集計', '要約', 'まとめる', '一覧化', '抽出', '横断的に', 'csv',
      'aggregate', 'summarize', 'collect', 'consolidate', 'compile',
      'roll up', 'tabulate',
    ],
  },
  {
    id: 'ptc-structured-output',
    group: 'ptc-positive',
    weight: 30,
    patterns: [
      'json', 'csv', 'yaml', '表形式', 'テーブル', '一覧表', 'レポート',
      '構造化', 'structured output', 'spreadsheet', 'markdown table',
    ],
  },
  {
    id: 'creator-dsh-feature',
    group: 'creator-positive',
    weight: 80,
    patterns: [
      'dsh に機能追加', 'dsh 自体', 'deepseek harness に', 'harness に機能',
      'エージェントプリセットを作成', 'dsh のプラグインを追加', 'dsh のバンドルを追加',
      'add a feature to dsh', 'extend dsh', 'add a plugin to dsh',
      'new dsh plugin', 'deepseek-harness feature',
    ],
  },
  {
    id: 'standard-code-fix',
    group: 'standard-positive',
    weight: 15,
    patterns: [
      'バグ修正', 'コード修正', 'リファクタ', 'テスト追加', '修正して', '実装して',
      'fix bug', 'fix the', 'refactor', 'add test', 'implement',
    ],
  },
  {
    id: 'gate-workflow',
    group: 'negative-gate',
    weight: -100,
    patterns: [
      'workflow', 'ワークフロー', 'ゴールを設定', '自動継続', 'スケジュール実行',
      'create a workflow', 'run workflow',
    ],
  },
  {
    id: 'gate-plugin-admin',
    group: 'negative-gate',
    weight: -100,
    patterns: [
      'plugin をインストール', 'プラグインを有効化', 'プラグインを無効化',
      'install plugin', 'enable plugin', 'disable plugin', 'plugin manager',
    ],
  },
  {
    id: 'gate-dsh-config',
    group: 'negative-gate',
    weight: -100,
    patterns: [
      'cordis.patch', 'cordis.yml', '設定ファイルを編集', 'コア設定',
      'settings.yaml', 'profile 設定',
    ],
  },
]

const RuleSchema = z.object({
  id: z.string(),
  group: z.string(),
  weight: z.number(),
  patterns: z.array(z.string()),
})

/** Validated config is handed to `apply` as its second argument. */
export const Config = z.object({
  enabled: z.boolean().default(true),
  defaultPreset: z.string().default(STANDARD),
  candidates: z.array(z.string()).default([...ALL_PRESETS]),
  rules: z.array(RuleSchema).default(DEFAULT_RULES),
  thresholds: z.object({
    scoreThreshold: z.number().default(60),
    margin: z.number().default(10),
    lowConfidence: z.number().default(60),
  }).default({}),
  llmFallback: z.boolean().default(false),
  brokenPresetPolicy: z.string().default('exclude'),
  respectExplicit: z.boolean().default(true),
})

/* ------------------------------------------------------------------ *
 * Pure helpers (no ctx, no I/O)
 * ------------------------------------------------------------------ */

function normalizeConfig(config = {}) {
  const thresholds = config.thresholds ?? {}
  return {
    enabled: config.enabled !== false,
    defaultPreset: config.defaultPreset || STANDARD,
    candidates: Array.isArray(config.candidates) && config.candidates.length
      ? config.candidates.filter(id => ALL_PRESETS.includes(id))
      : [...ALL_PRESETS],
    rules: Array.isArray(config.rules) ? config.rules : DEFAULT_RULES,
    thresholds: {
      scoreThreshold: Number.isFinite(thresholds.scoreThreshold) ? thresholds.scoreThreshold : 60,
      margin: Number.isFinite(thresholds.margin) ? thresholds.margin : 10,
      lowConfidence: Number.isFinite(thresholds.lowConfidence) ? thresholds.lowConfidence : 60,
    },
    llmFallback: config.llmFallback === true,
    brokenPresetPolicy: config.brokenPresetPolicy || 'exclude',
    respectExplicit: config.respectExplicit !== false,
  }
}

function patternMatches(pattern, haystack) {
  if (typeof pattern !== 'string' || pattern.length === 0) return false
  if (pattern.length > 2 && pattern.startsWith('/') && pattern.endsWith('/')) {
    try {
      return new RegExp(pattern.slice(1, -1), 'i').test(haystack)
    } catch {
      return false
    }
  }
  return haystack.includes(pattern.toLowerCase())
}

function anyPatternMatches(patterns, haystack) {
  return Array.isArray(patterns) && patterns.some(pattern => patternMatches(pattern, haystack))
}

function finite(value) {
  return Number.isFinite(value) ? value : 0
}

function makeResult(preset, scores, matchedRules, reason, fallback, confidence) {
  return {
    preset,
    reason,
    fallback,
    confidence: finite(confidence),
    matchedRules: [...matchedRules],
    scores: {
      standard: finite(scores.standard),
      ptc: finite(scores.ptc),
      creator: finite(scores.creator),
    },
  }
}

/**
 * Pure rule-based decision. Callers pass the request text and any contextual
 * flags; nothing here touches DSH services.
 *
 * @param {object} input
 * @param {string} [input.text] user request text
 * @param {string} [input.repoPath] session working directory
 * @param {boolean} [input.codingToolsEnabled=true] Coding Tools preference
 * @param {string[]} [input.broken=[]] preset ids that cannot be used
 * @param {object} config validated plugin config
 * @returns {{preset:string,reason:string,fallback:boolean,confidence:number,matchedRules:string[],scores:object}}
 */
export function decidePreset(input = {}, config = {}) {
  const cfg = normalizeConfig(config)
  const fallbackId = cfg.defaultPreset
  const textOnly = (input.text ?? '').toLowerCase()
  const haystack = `${input.repoPath ?? ''}\n${textOnly}`
  const broken = new Set(Array.isArray(input.broken) ? input.broken : [])
  // `exclude` removes broken ids from the race; `fallback` keeps them ranked
  // but routes a broken winner to the default preset.
  const allowed = cfg.brokenPresetPolicy === 'exclude'
    ? cfg.candidates.filter(id => !broken.has(id))
    : [...cfg.candidates]

  const scores = { standard: 10, ptc: 0, creator: 0 }
  const matchedRules = []
  const ptcGroups = new Set()
  let gated = false
  let ptcDisabled = false

  for (const rule of cfg.rules) {
    if (!rule || typeof rule.id !== 'string') continue
    const scope = (rule.group === 'negative-gate' || rule.group === 'ptc-positive')
      ? textOnly
      : haystack
    if (!anyPatternMatches(rule.patterns, scope)) continue
    matchedRules.push(rule.id)
    const weight = Number.isFinite(rule.weight) ? rule.weight : 0
    switch (rule.group) {
      case 'negative-gate':
        gated = true
        break
      case 'ptc-positive':
        ptcGroups.add(rule.id)
        scores.ptc += weight
        break
      case 'creator-positive':
        scores.creator += weight
        break
      case 'standard-positive':
        scores.standard += weight
        break
      default:
        break
    }
  }

  // PTC is eligible only when every configured PTC group matched.
  const requiredGroups = cfg.rules
    .filter(rule => rule && rule.group === 'ptc-positive')
    .map(rule => rule.id)
  const ptcComplete = requiredGroups.length === 0
    ? ptcGroups.size > 0
    : requiredGroups.every(id => ptcGroups.has(id))

  if (!ptcComplete || input.codingToolsEnabled === false) {
    scores.ptc = Number.NEGATIVE_INFINITY
    if (input.codingToolsEnabled === false && ptcComplete) {
      ptcDisabled = true
    }
  }

  // A negative gate keeps the deployment default untouched.
  if (gated) {
    return makeResult(fallbackId, scores, matchedRules, 'negative-gate', true, 0)
  }
  const ranked = allowed
    .filter(id => Number.isFinite(scores[id]))
    .map(id => ({ id, score: scores[id] }))
    .sort((a, b) => b.score - a.score)

  if (ranked.length === 0) {
    return makeResult(fallbackId, scores, matchedRules, 'no-eligible-candidate', true, 0)
  }

  const top = ranked[0]
  const second = ranked[1]
  const { scoreThreshold, margin, lowConfidence } = cfg.thresholds
  const confidence = second ? top.score - second.score : top.score

  if (ptcDisabled) {
    return makeResult(fallbackId, scores, matchedRules, 'coding-tools-disabled', true, confidence)
  }

  if (broken.has(top.id) && cfg.brokenPresetPolicy !== 'exclude') {
    return makeResult(fallbackId, scores, matchedRules, 'broken-preset-fallback', true, confidence)
  }
  if (top.score < scoreThreshold) {
    return makeResult(fallbackId, scores, matchedRules, 'below-score-threshold', true, confidence)
  }
  if (second && confidence < margin) {
    return makeResult(fallbackId, scores, matchedRules, 'below-margin', true, confidence)
  }

  // LLM fallback is opt-in (default false). The rule-only implementation has
  // no model call, so a low-confidence request falls back to the default.
  if (confidence < lowConfidence && cfg.llmFallback) {
    return makeResult(fallbackId, scores, matchedRules, 'llm-fallback-unavailable', true, confidence)
  }

  return makeResult(top.id, scores, matchedRules, 'rule-scoring', false, confidence)
}

/* ------------------------------------------------------------------ *
 * Host-side adapters (read-only; no settings/configEditor writes)
 * ------------------------------------------------------------------ */

function extractText(event) {
  const data = event?.data ?? {}
  const source = data.source ?? {}
  const parts = [
    data.text,
    data.content,
    source.text,
    source.content,
    source.prompt,
  ]
  const content = data.content ?? source.content
  if (Array.isArray(content)) {
    for (const part of content) {
      if (typeof part === 'string') parts.push(part)
      else if (part && typeof part.text === 'string') parts.push(part.text)
    }
  }
  return parts
    .filter(part => typeof part === 'string' && part.length > 0)
    .join('\n')
}

function extractRepoPath(session) {
  return session?.meta?.cwd ?? session?.header?.cwd ?? ''
}

function hasExplicitPreset(session, agentPresets) {
  try {
    const selectedDefault = agentPresets.config?.selectedDefault
    if (selectedDefault && typeof selectedDefault.get === 'function'
      && selectedDefault.get() !== undefined && selectedDefault.get() !== null) return true

    const deploymentDefault = agentPresets.defaultId
    const recorded = agentPresets.presetForSession?.(session)
    if (recorded !== undefined && recorded !== null && recorded !== deploymentDefault) return true

    const headerPreset = session?.header?.agentPreset
    if (headerPreset !== undefined && headerPreset !== null && headerPreset !== deploymentDefault) return true

    const metaPreset = session?.meta?.agentPreset
    if (metaPreset !== undefined && metaPreset !== null && metaPreset !== deploymentDefault) return true
  } catch {
    // Fail closed: an unreadable projection must not let auto-selection
    // overwrite a possible explicit choice.
    return true
  }
  return false
}

function readCodingToolsEnabled(ctx) {
  try {
    const settings = ctx.get('settings')
    const descriptors = settings?.describe?.({ redactSecrets: true })
    if (Array.isArray(descriptors)) {
      for (const descriptor of descriptors) {
        if (String(descriptor?.ns ?? '') !== 'ui-settings') continue
        const value = descriptor?.value
        if (value && typeof value === 'object' && 'enabled' in value) {
          return value.enabled !== false
        }
      }
    }
  } catch {
    // Unavailable preference: assume Coding Tools are enabled.
  }
  return true
}

function targetForSelect(ctx, session) {
  // The Host service signature is select(agent, preset). Never pass a session
  // id: select dereferences agent.id/session/ctx and would throw silently.
  return ctx.get('agents')?.get?.(session?.id)
}

function collectBrokenPresets(agentPresets) {
  try {
    const inventory = agentPresets.compositionInventory?.()
    if (Array.isArray(inventory)) {
      return inventory
        .filter(row => typeof row?.broken === 'string' && row.broken.length > 0)
        .map(row => row.id)
        .filter(id => typeof id === 'string')
    }
  } catch {
    // Inventory unavailable: fall back to no broken ids.
  }
  return []
}

/* ------------------------------------------------------------------ *
 * Plugin entry
 * ------------------------------------------------------------------ */

export function apply(ctx, config = {}) {
  const cfg = normalizeConfig(config)
  const logger = ctx.logger

  const log = (level, payload) => {
    try {
      const method = logger?.[level] ?? logger?.info
      if (typeof method === 'function') method.call(logger, 'dsh-auto-preset %o', payload)
    } catch {
      // Logging must never fail an event listener.
    }
  }

  if (!cfg.enabled) {
    log('info', { event: 'disabled' })
    return
  }

  log('info', { event: 'activated', candidates: cfg.candidates, thresholds: cfg.thresholds })

  const handleInbox = (event) => {
    const inserted = event?.data?.inserted
    if (!Array.isArray(inserted)) return null
    for (const message of inserted) {
      const source = message?.source
      if (!source || source.kind !== 'user') continue
      const text = extractText(message)
      if (text.length === 0) continue
      return text
    }
    return null
  }

  ctx.on('agent/inbox/spliced', (agent, event) => {
    const session = agent?.session
    if (!session) return
    const text = handleInbox(event)
    if (text === null) return

    try {
      const agents = ctx.get('agents')
      const boundary = agents?.turnBoundaryOf?.(session)
      if (!boundary || boundary.openTurnStartSeq !== null || boundary.lastTurn !== 0) return

      const agentPresets = ctx.agentPresets ?? ctx.get('agentPresets')
      if (!agentPresets) return

      if (cfg.respectExplicit && hasExplicitPreset(session, agentPresets)) {
        log('info', { event: 'skip-explicit', sessionId: session?.id })
        return
      }

      const decision = decidePreset({
        text,
        repoPath: extractRepoPath(session),
        codingToolsEnabled: readCodingToolsEnabled(ctx),
        broken: collectBrokenPresets(agentPresets),
      }, config)

      log('info', {
        event: 'decision',
        sessionId: session?.id,
        preset: decision.preset,
        reason: decision.reason,
        confidence: decision.confidence,
        scores: decision.scores,
        matchedRules: decision.matchedRules,
      })

      const target = targetForSelect(ctx, session)
      if (!target) {
        log('info', { event: 'no-agent', sessionId: session?.id })
        return
      }

      void Promise.resolve()
        .then(() => {
          // Re-check immediately before select to avoid a TOCTOU race with
          // a UI-staged explicit choice committed after the first check.
          if (cfg.respectExplicit && hasExplicitPreset(session, agentPresets)) {
            return { skipped: true }
          }
          return agentPresets.select(target, decision.preset).then(committed => ({ committed }))
        })
        .then(result => {
          if (result?.skipped) {
            log('info', { event: 'skip-explicit-race', sessionId: session?.id })
            return
          }
          log('info', {
            event: 'selected',
            sessionId: session?.id,
            preset: result?.committed ?? decision.preset,
            reason: decision.reason,
          })
        })
        .catch(error => {
          const code = error?.code ?? error?.data?.code
          if (code === 'agent-preset/locked') {
            log('info', { event: 'locked', sessionId: session?.id, preset: decision.preset })
            return
          }
          log('warn', {
            event: 'select-error',
            sessionId: session?.id,
            code: code ?? 'unknown',
            message: String(error?.message ?? error),
          })
        })
    } catch (error) {
      log('warn', {
        event: 'handler-error',
        sessionId: session?.id,
        message: String(error?.message ?? error),
      })
    }
  })
}
