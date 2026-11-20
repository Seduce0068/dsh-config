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
.gbr_details{max-width:calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));margin:2px auto 0;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:18px}
.gbr_details summary{cursor:pointer;width:max-content}
.gbr_details ul{margin:4px 0 0;padding-left:18px}
.gbr_dialog:modal{overscroll-behavior:contain;box-sizing:border-box;max-width:min(420px,calc(100vw - 32px));border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-specific-menu);color:var(--dsw-alias-label-primary);padding:24px}
.gbr_dialog::backdrop{overflow:hidden;overscroll-behavior:contain;background:rgba(0,0,0,.45)}
.gbr_dialog h2{margin:0 0 8px;font-size:16px;font-weight:600}
.gbr_dialog p{margin:0 0 20px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.gbr_dialog form{display:flex;justify-content:flex-end;gap:8px}
.gbr_dialog button{cursor:pointer;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-primary);padding:6px 14px;font:inherit;font-size:13px}
.gbr_dialog button.gbr_primary{background:var(--dsw-alias-interactive-bg-hover)}
`;
    const cls = {
      dock: 'gbr_dock', bar: 'gbr_bar', glyph: 'gbr_glyph', label: 'gbr_label',
      status: 'gbr_status', error: 'gbr_error', actions: 'gbr_actions',
      button: 'gbr_button', details: 'gbr_details', dialog: 'gbr_dialog', primary: 'gbr_primary',
    };
    const tagId = '@local/dsh-goal-bulk-resume/BulkResumeBar.module.css';

    const dict = {
      en: {
        'action.bulkResume': 'Resume all goals',
        'confirm.title': 'Resume all goals?',
        'confirm.body': 'Unfinished goals in all persisted sessions will be resumed. Cold sessions may be opened. Already-armed and complete goals are skipped.',
        'confirm.cancel': 'Cancel',
        'confirm.ok': 'Resume all',
        'status.running': 'Resuming goals',
        'status.done': 'Resumed {resumed}, skipped {skipped}, failed {failed}',
        'status.detail': 'Failure details',
        'status.error': 'Error: {error}',
      },
      ja: {
        'action.bulkResume': '全ゴールを再開',
        'confirm.title': '全ゴールを再開しますか？',
        'confirm.body': '永続化された全セッションの未完了ゴールを再開します。未オープンのセッションも起動される場合があります。すでにアクティブなゴールと完了済みはスキップされます。',
        'confirm.cancel': 'キャンセル',
        'confirm.ok': 'すべて再開',
        'status.running': 'ゴールを再開中',
        'status.done': '再開 {resumed} 件 / スキップ {skipped} 件 / 失敗 {failed} 件',
        'status.detail': '失敗の詳細',
        'status.error': 'エラー: {error}',
      },
      zh: {
        'action.bulkResume': '恢复所有目标',
        'confirm.title': '恢复所有目标？',
        'confirm.body': '将恢复所有持久化会话中未完成的目标，可能会打开尚未激活的会话。已激活和已完成的目标会被跳过。',
        'confirm.cancel': '取消',
        'confirm.ok': '全部恢复',
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

    function formatStatus(t, summary) {
      return t('status.done')
        .replace('{resumed}', summary.resumed)
        .replace('{skipped}', summary.skipped)
        .replace('{failed}', summary.failed);
    }

    function BulkResumeBar({ onBulkResume, t }) {
      const [phase, setPhase] = React.useState('idle');
      const [summary, setSummary] = React.useState(null);
      const [error, setError] = React.useState('');
      const [progress, setProgress] = React.useState({ done: 0, total: 0 });
      const dialogRef = React.useRef(null);
      const titleId = useUniqueId();
      const bodyId = useUniqueId();
      const busyRef = React.useRef(false);

      const execute = React.useCallback(async () => {
        if (busyRef.current) return;
        busyRef.current = true;
        setPhase('running');
        setError('');
        setSummary(null);
        setProgress({ done: 0, total: 0 });
        try {
          const result = await onBulkResume((done, total) => setProgress({ done, total }));
          setSummary(result);
          setPhase('done');
        } catch (cause) {
          setError(String(cause && cause.message ? cause.message : cause));
          setPhase('error');
        } finally {
          busyRef.current = false;
        }
      }, [onBulkResume]);

      const onDialogClose = React.useCallback(() => {
        const dialog = dialogRef.current;
        if (dialog === null) return;
        const value = dialog.returnValue;
        dialog.returnValue = '';
        if (value === 'confirm') void execute();
      }, [execute]);

      const open = React.useCallback(() => {
        if (dialogRef.current !== null) dialogRef.current.showModal();
      }, []);

      const label = t('action.bulkResume');
      const failures = phase === 'done' && summary ? summary.failures : [];
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
            phase === 'running' && h('span', {
              className: cls.status,
              role: 'progressbar',
              'aria-valuemin': 0,
              'aria-valuemax': progress.total,
              'aria-valuenow': progress.done,
            }, t('status.running') + ' ' + progress.done + '/' + progress.total),
            phase === 'done' && summary && h('span', {
              className: cls.status,
              role: 'status',
              title: failures.length > 0 ? failures.join('\n') : undefined,
            }, formatStatus(t, summary)),
            phase === 'error' && h('span', { className: cls.error, role: 'alert' }, t('status.error').replace('{error}', error)),
            h('div', { className: cls.actions },
              h('button', {
                type: 'button',
                className: cls.button,
                onClick: open,
                disabled: phase === 'running',
                'aria-label': label,
              }, label)
            )
          ),
          failures.length > 0 && h('details', { className: cls.details },
            h('summary', null, t('status.detail')),
            h('ul', null, failures.map((failure, index) => h('li', { key: index }, failure)))
          )
        ),
        h('dialog', {
          ref: dialogRef,
          className: cls.dialog,
          'aria-labelledby': titleId,
          'aria-describedby': bodyId,
          onClose: onDialogClose,
        },
          h('h2', { id: titleId }, t('confirm.title')),
          h('p', { id: bodyId }, t('confirm.body')),
          h('form', { method: 'dialog' },
            h('button', { value: 'cancel', autofocus: '' }, t('confirm.cancel')),
            h('button', { value: 'confirm', className: cls.primary }, t('confirm.ok'))
          )
        )
      );
    }

    async function runBulkResume(ctx, onProgress) {
      const listed = await ctx.remote.session.list({});
      if (!listed.ok) throw new Error(errText(listed));
      const sessions = listed.value.items.filter(s => s.origin !== 'subagent');
      let resumed = 0, skipped = 0, failed = 0, done = 0;
      const failures = [];
      onProgress(0, sessions.length);
      for (const session of sessions) {
        const got = await ctx.remote.goals.get(session.sessionId);
        if (!got.ok) {
          failed++;
          failures.push(session.sessionId + ': ' + errText(got));
        } else {
          const goal = got.value;
          if (goal === undefined || goal === null || goal.phase === 'complete'
            || (goal.phase === 'active' && goal.activation === 'armed')) {
            skipped++;
          } else {
            const ref = { id: goal.id, revision: goal.revision };
            const result = await ctx.remote.goals.resume(session.sessionId, ref);
            if (result.ok) resumed++;
            else { failed++; failures.push(session.sessionId + ': ' + errText(result)); }
          }
        }
        done++;
        onProgress(done, sessions.length);
      }
      return { total: sessions.length, resumed, skipped, failed, failures };
    }

    return {
      inject: ['slots', 'locale'],
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
        ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
          name: 'conversation.input.dock',
          id: 'goal-bulk-resume',
          order: 9,
          locale: NS,
          inject: () => ({ onBulkResume: onProgress => runBulkResume(ctx, onProgress) }),
        }, BulkResumeBar));
      },
    };
  },
});
