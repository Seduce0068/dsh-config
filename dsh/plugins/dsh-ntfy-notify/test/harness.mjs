/**
 * Offline harness for the host half of dsh-ntfy-notify.
 *
 * Boots the plugin against a fake Context, drives the three event sources, and
 * captures every HTTP publish at a local stand-in server. Run with:
 *
 *   node test/harness.mjs
 *
 * No network access is needed; nothing is sent to ntfy.
 */

import http from 'node:http'
import { apply } from '../lib/index.js'

const received = []
let sessionIdCounter = 0

/** Stand-in for ntfy: records every publish and answers 200. */
function startStandIn() {
  const standIn = {
    route: (req, res) => {
      res.statusCode = 503
      res.end('route not attached')
    },
  }
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/api/ntfy-notify/presence') {
        standIn.route(req, res)
        return
      }
      let body = ''
      req.on('data', (chunk) => (body += chunk))
      req.on('end', () => {
        received.push({
          method: req.method,
          path: req.url,
          headers: req.headers,
          // Non-ASCII titles travel as the X-Title encoded word.
          title: req.headers['x-title'] ?? req.headers.title ?? '',
          body,
        })
        res.statusCode = 200
        res.end('ok')
      })
    })
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      standIn.server = server
      standIn.base = `http://127.0.0.1:${port}`
      resolve(standIn)
    })
  })
}

/** Minimal Context: collects listeners and routes so the test can fire them. */
function createContext() {
  const routes = new Map()
  const listeners = new Map()
  const warnings = []
  return {
    ctx: {
      on(event, listener) {
        const list = listeners.get(event) ?? []
        list.push(listener)
        listeners.set(event, list)
      },
      logger(level) {
        return (line) => warnings.push(`${level} ${line}`)
      },
      webServer: {
        register(route) {
          routes.set(route.path, route.handler)
          return () => routes.delete(route.path)
        },
      },
    },
    routes,
    listeners,
    warnings,
    fire(event, ...args) {
      const results = []
      for (const listener of listeners.get(event) ?? []) results.push(listener(...args))
      return results
    },
  }
}

/** POST one presence report the way the browser half does. */
function reportPresence(base, report) {
  return fetch(`${base}/api/ntfy-notify/presence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  })
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Decode an RFC 2047 encoded-word header back into text; passes ASCII through. */
function decodeTitle(value = '') {
  const match = /^=\?UTF-8\?B\?(.*)\?=$/u.exec(value)
  return match === null ? value : Buffer.from(match[1], 'base64').toString('utf8')
}

/** Publishes that are actual notifications (X-Clear retractions excluded). */
const pushes = () => received.filter((entry) => entry.headers?.['x-clear'] !== 'true')

let failures = 0
function check(name, condition, extra) {
  if (condition) {
    console.log(`  ok   ${name}`)
  } else {
    failures += 1
    console.log(`  FAIL ${name}${extra === undefined ? '' : ` — ${JSON.stringify(extra)}`}`)
  }
}

async function main() {
  const standIn = await startStandIn()
  const { server, base } = standIn
  const { ctx, routes, fire, warnings } = createContext()
  const sessionId = `sess-${++sessionIdCounter}`

  apply(ctx, {
    server: base,
    topic: 'test-topic',
    sound: true,
    notifyApproval: true,
    notifyQuestion: true,
    notifyTurnComplete: true,
  })

  // The presence route has to be reachable from the web server.
  const handler = routes.get('/api/ntfy-notify/presence')
  check('presence route registered', typeof handler === 'function')

  // Serve the presence route through the stand-in so the real fetch path runs too.
  standIn.route = (req, res) => handler(req, res)

  console.log('\n1. approval while nobody is watching')
  fire('approval/request', {
    agent: { session: { id: sessionId } },
    toolName: 'bash',
    callId: 'call-1',
    reason: 'rm -rf build',
  }, async () => 'allowed-once')
  await wait(150)
  check('one approval push', pushes().length === 1, pushes().length)
  check('title carries the tool', decodeTitle(pushes()[0]?.title).includes('bash'), pushes()[0]?.title)
  check('max priority', pushes()[0]?.headers?.priority === 'max', pushes()[0]?.headers?.priority)
  check('body carries the reason', pushes()[0]?.body?.includes('rm -rf build'), pushes()[0]?.body)

  console.log('\n2. same approval replayed → deduped')
  fire('approval/request', {
    agent: { session: { id: sessionId } },
    toolName: 'bash',
    callId: 'call-1',
  }, async () => 'allowed-once')
  await wait(120)
  check('still one push', pushes().length === 1, pushes().length)

  console.log('\n3. browser reports the session watched → approval stays quiet')
  await reportPresence(base, { sessionId, foreground: true, main: true })
  await wait(60)
  fire('approval/request', {
    agent: { session: { id: sessionId } },
    toolName: 'bash',
    callId: 'call-2',
  }, async () => 'allowed-once')
  await wait(150)
  check('no new push while watching', pushes().length === 1, pushes().length)

  console.log('\n4. question on a session nobody watches')
  const other = `${sessionId}-other`
  fire('session/event', { id: other }, {
    type: 'tool/call',
    seq: 7,
    data: { call: { name: 'ask_user_question', callId: 'q-1', arguments: { questions: [{ question: 'Which branch should I use?' }] } } },
  })
  await wait(150)
  check('question push', pushes().length === 2, pushes().length)
  check('body carries the question', pushes()[1]?.body?.includes('Which branch'), pushes()[1]?.body)

  console.log('\n5. turn end while the browser is in the foreground → silent')
  await reportPresence(base, { sessionId, foreground: true, main: true })
  await wait(60)
  fire('session/event', { id: other }, { type: 'turn/end', seq: 9, data: { turn: 3, reason: { kind: 'completed' } } })
  await wait(150)
  check('no push while foreground', pushes().length === 2, pushes().length)

  console.log('\n6. turn end while the tab is hidden → pushed')
  await reportPresence(base, { sessionId, foreground: false, main: true })
  await wait(60)
  fire('session/event', { id: other }, { type: 'turn/end', seq: 11, data: { turn: 4, reason: { kind: 'completed' } } })
  await wait(150)
  check('completion push', pushes().length === 3, pushes().length)
  check('completion priority pops up', pushes()[2]?.headers?.priority === 'high', pushes()[2]?.headers?.priority)
  check('completion title', decodeTitle(pushes()[2]?.title).includes('完了'), pushes()[2]?.title)

  console.log('\n7. child session turn end never pushes')
  fire('session/event', { id: 'child-1', parentSessionId: other }, { type: 'turn/end', seq: 2, data: { turn: 1, reason: { kind: 'completed' } } })
  await wait(150)
  check('child ignored', pushes().length === 3, pushes().length)

  console.log('\n8. failure turn reports as failed')
  fire('session/event', { id: other }, { type: 'turn/end', seq: 13, data: { turn: 5, reason: { kind: 'error' } } })
  await wait(150)
  check('failure push', pushes().length === 4, pushes().length)
  check('failure title', decodeTitle(pushes()[3]?.title).includes('失敗'), pushes()[3]?.title)

  console.log('\n9. an answered approval retracts the waiting push')
  // Nobody is looking at this session any more, so the approval is pushed.
  await reportPresence(base, { sessionId, foreground: false, main: true })
  await wait(60)
  const beforeClear = pushes().length
  const clearsBefore = received.filter((entry) => entry.headers?.['x-clear'] === 'true').length
  fire('approval/request', {
    agent: { session: { id: other } },
    toolName: 'bash',
    callId: 'call-clear',
  }, async () => 'rejected')
  await wait(250)
  const clearCalls = received.filter((entry) => entry.headers?.['x-clear'] === 'true').length
  check('the approval itself was pushed once', pushes().length === beforeClear + 1, pushes().length)
  check('approval answered → clear sent', clearCalls > clearsBefore, clearCalls)

  console.log('\n10. a settled question retracts its push')
  const clearsBeforeQuestion = received.filter((entry) => entry.headers?.['x-clear'] === 'true').length
  fire('session/event', { id: other }, {
    type: 'tool/call',
    seq: 21,
    data: { call: { name: 'ask_user_question', callId: 'q-clear', arguments: { questions: [{ question: 'Answer me' }] } } },
  })
  await wait(120)
  fire('session/event', { id: other }, { type: 'tool/result', seq: 22, data: { callId: 'q-clear' } })
  await wait(200)
  const clearsAfterQuestion = received.filter((entry) => entry.headers?.['x-clear'] === 'true').length
  check('question settled → clear sent', clearsAfterQuestion > clearsBeforeQuestion, clearsAfterQuestion)

  console.log('\n11. a new turn retracts the completion push')
  const clearsBeforeTurn = received.filter((entry) => entry.headers?.['x-clear'] === 'true').length
  await reportPresence(base, { sessionId, foreground: false, main: true })
  fire('session/event', { id: other }, { type: 'turn/end', seq: 31, data: { turn: 6, reason: { kind: 'completed' } } })
  await wait(150)
  fire('session/event', { id: other }, { type: 'turn/start', seq: 32, data: { turn: 7 } })
  await wait(200)
  const clearsAfterTurn = received.filter((entry) => entry.headers?.['x-clear'] === 'true').length
  check('next turn → clear sent', clearsAfterTurn > clearsBeforeTurn, clearsAfterTurn)

  console.log('\n12. a goal round finishing does not push')
  const goalSession = `${sessionId}-goal`
  const beforeGoal = pushes().length
  fire('session/event', { id: goalSession }, {
    type: 'user/message',
    seq: 41,
    data: { source: { kind: 'goal', goalId: 'goal-1', revision: 1, round: 1 } },
  })
  fire('session/event', { id: goalSession }, {
    type: 'turn/end',
    seq: 42,
    data: { turn: 8, reason: { kind: 'completed' } },
  })
  await wait(150)
  check('goal turn end stays silent', pushes().length === beforeGoal, pushes().length)

  console.log('\n13. a normal turn after a goal still pushes')
  fire('session/event', { id: goalSession }, {
    type: 'turn/end',
    seq: 43,
    data: { turn: 9, reason: { kind: 'completed' } },
  })
  await wait(150)
  check('normal turn end pushes again', pushes().length === beforeGoal + 1, pushes().length)

  server.close()
  if (warnings.length > 0) console.log('\nlog:', warnings.join('\n'))
  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
