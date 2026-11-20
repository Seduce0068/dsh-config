window.__ModuleLoader__.load({
  id: '@local/dsh-goal-bulk-resume',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'goal-bulk-resume';
    const css = `
.gbr_dock{box-sizing:border-box;width:calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));margin:0 auto}
.gbr_bar{isolation:isolate;box-sizing:border-box;width:100%;max-width:calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));--dsw-elevation-stroke-color:var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md);height:36px;box-shadow:var(--dsw-elevation-panel);border:0;align-items:center;gap:10px;margin:0 auto;padding:4px 5px 4px 12px;display:flex;position:relative}
.gbr_bar:before{z-index:-1;border-radius:inherit;background:var(--dsw-specific-menu);backdrop-filter:var(--dsw-menu-backdrop-filter);content:"";pointer-events:none;position:absolute;inset:0}
.gbr_glyph{color:var(--dsw-alias-label-tertiary);flex:none;display:inline-flex}
.gbr_label{color:var(--dsw-alias-label-primary);flex:none;font-size:13px;font-weight:500;line-height:24px}
.gbr_status{min-width:0;color:var(--dsw-alias-label-primary-dimmed);text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:12px;line-height:20px;overflow:hidden}
.gbr_error{min-width:0;color:var(--dsw-alias-state-error-primary);text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:12px;line-height:20px;overflow:hidden}
.gbr_actions{flex:none;align-items:center;gap:8px;display:flex}
.gbr_button{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:999px;justify-content:center;align-items:center;padding:4px 10px;display:inline-flex;font:inherit;font-size:12px;font-weight:500;line-height:20px}
.gbr_button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.gbr_button:disabled{opacity:.4;cursor:default}
.gbr_menuRow{box-sizing:border-box;width:100%;min-height:32px;display:flex;align-items:center;gap:10px;padding:6px 12px;cursor:pointer;background:transparent;border:0;border-radius:var(--dsw-radius-sm);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;text-align:left}
.gbr_menuRow:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.gbr_menuRow:disabled{opacity:.4;cursor:default}
.gbr_details{max-width:calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));margin:2px auto 0;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:18px}
.gbr_details summary{cursor:pointer;width:max-content}
.gbr_details ul{margin:4px 0 0;padding-left:18px}
.gbr_dialog:modal{overscroll-behavior:contain;box-sizing:border-box;width:min(640px,calc(100vw - 32px));max-height:min(80vh,720px);border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-specific-menu);color:var(--dsw-alias-label-primary);padding:24px;display:flex;flex-direction:column}
.gbr_dialog::backdrop{overflow:hidden;overscroll-behavior:contain;background:rgba(0,0,0,.45)}
.gbr_dialog h2{margin:0 0 8px;font-size:16px;font-weight:600}
.gbr_dialog p{margin:0 0 12px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.gbr_list{min-height:0;overflow:auto;margin:0 0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm)}
.gbr_row{display:grid;grid-template-columns:88px 92px minmax(0,1fr);gap:10px;align-items:start;padding:6px 10px;font-size:12px;line-height:18px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.gbr_row:last-child{border-bottom:0}
.gbr_session{color:var(--dsw-alias-label-tertiary);font-family:var(--dsw-font-mono,monospace);overflow:hidden;text-overflow:ellipsis}
.gbr_phase{color:var(--dsw-alias-label-secondary)}
.gbr_objective{color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}
.gbr_empty{padding:16px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:13px}
.gbr_note{margin:0 0 12px;font-size:11px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.gbr_form{display:flex;justify-content:flex-end;gap:8px}
.gbr_form button{cursor:pointer;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-primary);padding:6px 14px;font:inherit;font-size:13px}
.gbr_form button.gbr_primary{background:var(--dsw-alias-interactive-bg-hover)}
.gbr_form button:disabled{opacity:.4;cursor:default}
`;
    const cls = {
      dock: 'gbr_dock', bar: 'gbr_bar', glyph: 'gbr_glyph', label: 'gbr_label',
      status: 'gbr_status', error: 'gbr_error', actions: 'gbr_actions',
      button: 'gbr_button', menuRow: 'gbr_menuRow', details: 'gbr_details', dialog: 'gbr_dialog',
      list: 'gbr_list', row: 'gbr_row', session: 'gbr_session', phase: 'gbr_phase',
      objective: 'gbr_objective', empty: 'gbr_empty', note: 'gbr_note',
      form: 'gbr_form', primary: 'gbr_primary',
    };
    const tagId = '@local/dsh-goal-bulk-resume/BulkResumeBar.module.css';

    const dict = {
      en: {
        'action.review': 'Review goals to resume',
        'confirm.title': 'Goals to resume',
        'confirm.body': 'These unfinished goals will be resumed. Cold sessions may be opened. Already-armed and complete goals are skipped.',
        'confirm.ok': 'Resume {count}',
        'confirm.cancel': 'Cancel',
        'confirm.empty': 'No goals need resuming.',
        'confirm.note': 'Session IDs are abbreviated. Failure details are listed below when present.',
        'phase.active': 'Active, inactive',
        'phase.paused': 'Paused',
        'phase.blocked': 'Blocked',
        'status.scanning': 'Scanning sessions',
        'status.running': 'Resuming goals',
        'status.done': 'Resumed {resumed}, skipped {skipped}, failed {failed}',
        'status.detail': 'Failure details',
        'status.error': 'Error: {error}',
      },
      ja: {
        'action.review': '再開対象を確認',
        'confirm.title': '再開するゴール',
        'confirm.body': '以下の未完了ゴールを再開します。未オープンのセッションも起動される場合があります。すでにアクティブなゴールと完了済みは対象外です。',
        'confirm.ok': '{count} 件を再開',
        'confirm.cancel': 'キャンセル',
        'confirm.empty': '再開が必要なゴールはありません。',
        'confirm.note': 'セッション ID は短縮表示です。失敗がある場合は下に詳細を表示します。',
        'phase.active': '非アクティブ',
        'phase.paused': '一時停止',
        'phase.blocked': 'ブロック中',
        'status.scanning': 'セッションを確認中',
        'status.running': 'ゴールを再開中',
        'status.done': '再開 {resumed} 件 / スキップ {skipped} 件 / 失敗 {failed} 件',
        'status.detail': '失敗の詳細',
        'status.error': 'エラー: {error}',
      },
      zh: {
        'action.review': '查看要恢复的目标',
        'confirm.title': '要恢复的目标',
        'confirm.body': '将恢复以下未完成的目标，可能会打开尚未激活的会话。已激活和已完成的目标不在范围内。',
        'confirm.ok': '恢复 {count} 项',
        'confirm.cancel': '取消',
        'confirm.empty': '没有需要恢复的目标。',
        'confirm.note': '会话 ID 为缩写。如有失败，详情见下方。',
        'phase.active': '未激活',
        'phase.paused': '已暂停',
        'phase.blocked': '已受阻',
        'status.scanning': '正在检查会话',
        'status.running': '正在恢复目标',
        'status.done': '已恢复 {resumed}，已跳过 {skipped}，失败 {failed}',
        'status.detail': '失败详情',
        'status.error': '错误：{error}',
      },
    };

    let seq = 0;
    function useUniqueId() {
      const ref = React.useRef(null);
      if (ref.current === null) ref.current = 'gbr-' + (++seq);
      return ref.current;
    }

    function errText(result) {
      const error = result && result.error;
      if (!error) return 'unknown error';
      return error.message ? (error.code ? error.message + ' (' + error.code + ')' : error.message) : String(error.code || error);
    }

    function shortId(id) {
      const text = String(id || '');
      return text.length > 8 ? text.slice(0, 8) : text;
    }

    function phaseKey(goal) {
      return goal.phase === 'active' ? 'phase.active'
        : goal.phase === 'blocked' ? 'phase.blocked' : 'phase.paused';
    }

    function useBulkResume(onScan, onExecute, onDismiss) {
      const [phase, setPhase] = React.useState('idle');
      const [plan, setPlan] = React.useState(null);
      const [result, setResult] = React.useState(null);
      const [error, setError] = React.useState('');
      const [progress, setProgress] = React.useState({ done: 0, total: 0 });
      const dialogRef = React.useRef(null);
      const titleId = useUniqueId();
      const bodyId = useUniqueId();
      const busyRef = React.useRef(false);

      const review = React.useCallback(async () => {
        if (busyRef.current) return;
        busyRef.current = true;
        setPhase('scanning');
        setError('');
        setPlan(null);
        setResult(null);
        setProgress({ done: 0, total: 0 });
        try {
          const scanned = await onScan((done, total) => setProgress({ done, total }));
          setPlan(scanned);
          setPhase('review');
          const dialog = dialogRef.current;
          if (dialog !== null) dialog.showModal();
        } catch (cause) {
          setError(String(cause && cause.message ? cause.message : cause));
          setPhase('error');
        } finally {
          busyRef.current = false;
        }
      }, [onScan]);

      const execute = React.useCallback(async () => {
        if (plan === null || busyRef.current) return;
        busyRef.current = true;
        setPhase('running');
        setError('');
        setResult(null);
        setProgress({ done: 0, total: plan.targets.length });
        try {
          const done = await onExecute(plan.targets, (n, total) => setProgress({ done: n, total }));
          setResult(done);
          setPhase('done');
        } catch (cause) {
          setError(String(cause && cause.message ? cause.message : cause));
          setPhase('error');
        } finally {
          busyRef.current = false;
        }
      }, [onExecute, plan]);

      const onDialogClose = React.useCallback(() => {
        const dialog = dialogRef.current;
        if (dialog === null) return;
        const value = dialog.returnValue;
        dialog.returnValue = '';
        if (onDismiss) onDismiss();
        if (value === 'confirm') void execute();
      }, [execute, onDismiss]);

      return {
        phase, plan, result, error, progress, dialogRef, titleId, bodyId,
        busy: phase === 'scanning' || phase === 'running',
        review, onDialogClose,
        failures: phase === 'done' && result ? result.failures : [],
      };
    }

    function ConfirmDialog({ flow, t }) {
      const plan = flow.plan;
      return h('dialog', {
        ref: flow.dialogRef,
        className: cls.dialog,
        'aria-labelledby': flow.titleId,
        'aria-describedby': flow.bodyId,
        onClose: flow.onDialogClose,
      },
        h('h2', { id: flow.titleId }, t('confirm.title')),
        h('p', { id: flow.bodyId }, t('confirm.body')),
        plan && h(React.Fragment, null,
          h('div', { className: cls.list, role: 'list' },
            plan.targets.length === 0
              ? h('div', { className: cls.empty }, t('confirm.empty'))
              : plan.targets.map(target => h('div', { className: cls.row, key: target.sessionId, role: 'listitem' },
                h('span', { className: cls.session, title: target.sessionId }, shortId(target.sessionId)),
                h('span', { className: cls.phase }, t(phaseKey(target)) + (target.blockedReason ? ' — ' + target.blockedReason : '')),
                h('span', { className: cls.objective }, target.objective)
              ))
          ),
          (plan.skipped.length > 0 || plan.failures.length > 0)
            && h('p', { className: cls.note },
              t('confirm.note') + '  skipped=' + plan.skipped.length + ' failed=' + plan.failures.length)
        ),
        h('form', { className: cls.form, method: 'dialog' },
          h('button', { value: 'cancel', autofocus: '' }, t('confirm.cancel')),
          h('button', {
            value: 'confirm', className: cls.primary,
            disabled: !plan || plan.targets.length === 0,
          }, t('confirm.ok').replace('{count}', plan ? plan.targets.length : 0))
        )
      );
    }

    function failureDetails(flow, t) {
      return flow.failures.length > 0 && h('details', { className: cls.details },
        h('summary', null, t('status.detail')),
        h('ul', null, flow.failures.map((failure, index) => h('li', { key: index }, failure)))
      );
    }

    function BulkResumeBar({ onScan, onExecute, t }) {
      const flow = useBulkResume(onScan, onExecute, null);
      const label = t('action.review');
      return h(React.Fragment, null,
        h('div', { className: cls.dock, 'data-goal-bulk-resume': '' },
          h('div', { className: cls.bar },
            h('span', { className: cls.glyph, 'aria-hidden': 'true' },
              h('svg', { width: 14, height: 14, viewBox: '0 0 36 36' },
                h('path', { d: 'M6 9v18', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' }),
                h('path', { d: 'M11 9.2a1.5 1.5 0 0 1 2.3-1.27l14.2 8.8a1.5 1.5 0 0 1 0 2.54l-14.2 8.8A1.5 1.5 0 0 1 11 26.8V9.2Z', fill: 'currentColor' })
              )
            ),
            h('span', { className: cls.label }, label),
            flow.phase === 'scanning' && h('span', {
              className: cls.status, role: 'progressbar',
              'aria-valuemin': 0, 'aria-valuemax': flow.progress.total, 'aria-valuenow': flow.progress.done,
            }, t('status.scanning') + ' ' + flow.progress.done + '/' + flow.progress.total),
            flow.phase === 'running' && h('span', {
              className: cls.status, role: 'progressbar',
              'aria-valuemin': 0, 'aria-valuemax': flow.progress.total, 'aria-valuenow': flow.progress.done,
            }, t('status.running') + ' ' + flow.progress.done + '/' + flow.progress.total),
            flow.phase === 'done' && flow.result && h('span', {
              className: cls.status, role: 'status',
              title: flow.failures.length > 0 ? flow.failures.join('\n') : undefined,
            }, t('status.done')
              .replace('{resumed}', flow.result.resumed)
              .replace('{skipped}', flow.result.skipped)
              .replace('{failed}', flow.result.failed)),
            flow.phase === 'error' && h('span', { className: cls.error, role: 'alert' },
              t('status.error').replace('{error}', flow.error)),
            h('div', { className: cls.actions },
              h('button', {
                type: 'button', className: cls.button, onClick: flow.review,
                disabled: flow.busy, 'aria-label': label,
              }, label)
            )
          ),
          failureDetails(flow, t)
        ),
        h(ConfirmDialog, { flow, t })
      );
    }

    function SidebarAction({ onScan, onExecute, onDismiss, t }) {
      const flow = useBulkResume(onScan, onExecute, onDismiss);
      const label = t('action.review');
      return h(React.Fragment, null,
        h('button', {
          type: 'button', className: cls.menuRow, onClick: flow.review,
          disabled: flow.busy, 'aria-label': label,
        }, label),
        h(ConfirmDialog, { flow, t })
      );
    }

    async function scanGoals(ctx, onProgress) {
      const listed = await ctx.remote.session.list({});
      if (!listed.ok) throw new Error(errText(listed));
      const sessions = listed.value.items.filter(s => s.origin !== 'subagent');
      const targets = [], skipped = [], failures = [];
      let done = 0;
      onProgress(0, sessions.length);
      for (const session of sessions) {
        const got = await ctx.remote.goals.get(session.sessionId);
        if (!got.ok) {
          failures.push(shortId(session.sessionId) + ': ' + errText(got));
        } else {
          const goal = got.value;
          if (goal === undefined || goal === null || goal.phase === 'complete'
            || (goal.phase === 'active' && goal.activation === 'armed')) {
            skipped.push(shortId(session.sessionId));
          } else {
            targets.push({
              sessionId: session.sessionId,
              id: goal.id,
              revision: goal.revision,
              phase: goal.phase,
              objective: goal.objective,
              blockedReason: goal.blockedReason && goal.blockedReason.message,
            });
          }
        }
        done++;
        onProgress(done, sessions.length);
      }
      return { total: sessions.length, targets, skipped, failures };
    }

    async function resumeTargets(ctx, targets, onProgress) {
      let resumed = 0, failed = 0, done = 0;
      const failures = [];
      onProgress(0, targets.length);
      for (const target of targets) {
        const result = await ctx.remote.goals.resume(target.sessionId, { id: target.id, revision: target.revision });
        if (result.ok) resumed++;
        else { failed++; failures.push(shortId(target.sessionId) + ': ' + errText(result)); }
        done++;
        onProgress(done, targets.length);
      }
      return { total: targets.length, resumed, failed, failures };
    }

    return {
      inject: ['slots', 'locale', 'remote', 'remote.goals', 'remote.session'],
      apply(ctx) {
        ctx.effect(() => {
          if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
            const tag = document.createElement('style');
            tag.dataset.plugin = '@local/dsh-goal-bulk-resume';
            tag.dataset.pluginCss = tagId;
            tag.textContent = css;
            document.head.appendChild(tag);
            return () => { tag.remove(); };
          }
        }, 'goal-bulk-resume: styles');
        ctx.effect(() => ctx.locale.register(NS, dict), 'goal-bulk-resume: locale');
        const callbacks = () => ({
          onScan: onProgress => scanGoals(ctx, onProgress),
          onExecute: (targets, onProgress) => resumeTargets(ctx, targets, onProgress),
        });
        ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
          name: 'conversation.input.dock',
          id: 'goal-bulk-resume',
          order: 9,
          locale: NS,
          inject: callbacks,
        }, BulkResumeBar));
        ctx.slots.inject('sidebar.panellist.actions', () => ctx.slots.register({
          name: 'sidebar.panellist.actions',
          id: 'goal-bulk-resume',
          order: 90,
          locale: NS,
          inject: props => ({ ...callbacks(), onDismiss: props && props.onDismiss }),
        }, SidebarAction));
      },
    };
  },
});
