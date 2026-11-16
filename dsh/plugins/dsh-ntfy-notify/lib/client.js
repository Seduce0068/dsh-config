/**
 * dsh-ntfy-notify — browser half.
 *
 * The host half decides whether a push is warranted, but only the browser
 * knows whether the human is looking at the session. This half reports two
 * facts to `POST /api/ntfy-notify/presence`:
 *
 *  - `sessionId`: the session its main conversation view shows right now
 *  - `foreground`: whether this page is visible (tab not hidden)
 *
 * It reports on load, on visibility changes, and whenever the shown session
 * moves, plus a slow heartbeat so the host's presence window stays fresh.
 *
 * The browser delivers client modules as classic scripts, not ES modules:
 * every module must register itself through `window.__ModuleLoader__.load`
 * and expose its plugin face on `module.exports`. A raw `export` statement
 * here makes the boot loader report "import failed (see console)".
 *
 * @module dsh-ntfy-notify/client
 */

window.__ModuleLoader__.load({
  id: 'dsh-ntfy-notify',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const ROUTE = 'api/ntfy-notify/presence'
    /** Heartbeat while the tab is visible. Hidden tabs report on change only. */
    const HEARTBEAT_MS = 45_000

    /** Services this plugin reads on the client. */
    const inject = ['sessions']

    /**
     * Read the session the main conversation view shows. The workspace navigation
     * retains exactly one session with the `mainView` source while it is on screen,
     * so that count answers the question without the plugin owning any state.
     * @param sessions - the session list face.
     * @returns the session id, or undefined without one.
     */
    function mainSessionId(sessions) {
      try {
        const snapshot = sessions.list.getSnapshot()
        for (const id of snapshot?.ids ?? []) {
          const info = sessions.retainInfo(id).getSnapshot()
          if ((info?.retainedBy?.mainView ?? 0) > 0) return id
        }
      } catch {
        // Fall through to "unknown": the host treats that as not watching.
      }
      return undefined
    }

    /** Whether this page is visible to the human. */
    function isForeground() {
      return typeof document !== 'undefined' && document.visibilityState === 'visible'
    }

    /**
     * Mount the presence reporter.
     * @param ctx - client root context.
     */
    function apply(ctx) {
      const sessions = ctx.sessions
      let disposed = false
      let timer

      const report = () => {
        if (disposed) return
        const body = JSON.stringify({
          sessionId: mainSessionId(sessions) ?? '',
          foreground: isForeground(),
          main: true,
        })
        try {
          void fetch(ROUTE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
            credentials: 'same-origin',
          }).catch(() => {
            // Presence is advisory; a failed report only keeps pushes enabled.
          })
        } catch {
          // Ignore transport failures.
        }
      }

      const schedule = () => {
        if (typeof window === 'undefined') return
        clearInterval(timer)
        timer = setInterval(() => {
          if (isForeground()) report()
        }, HEARTBEAT_MS)
        timer.unref?.()
      }

      const onVisibility = () => report()

      if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility)
      schedule()
      report()

      // Follow the shown session so the host knows which conversations are open here.
      let unsubscribe
      try {
        unsubscribe = sessions.list.subscribe(() => report())
      } catch {
        unsubscribe = undefined
      }

      ctx.effect(() => () => {
        disposed = true
        clearInterval(timer)
        unsubscribe?.()
        if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility)
      }, 'ntfy-notify: presence reporter')
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
