# スマホ通知の構成と goal 中の抑制

DSH のスマホ通知は用途が二つに分かれています。

| プラグイン | 経路 | 担当 |
| --- | --- | --- |
| `dsh-mobile-maxxing` | Web Push（PWA の Service Worker） | アプリを開いている間のバナー、タップでセッションを開く |
| `dsh-ntfy-notify` | ntfy.sh への HTTP publish | ブラウザを閉じていても届く承認待ち・質問待ち・ターン完了 |

ソースは [`dsh/plugins/dsh-ntfy-notify/`](../dsh/plugins/dsh-ntfy-notify/) に収録しています（リンク先プラグインのバックアップ）。

## goal ラウンドは通知しない

goal の自動継続ラウンドは通常のターンと同じ `turn/end` イベントを発火します。
そのまま通知するとラウンドごとにスマホが鳴り続けるため、`dsh-ntfy-notify` が抑制します。

- `user/message` の `source.kind === 'goal'` を見てセッションにマーカーを付ける。
- `turn/end` では、**マーカーを消す前に**判定して抑制する。
- 人手のメッセージが来たらマーカーを消し、中断後の通常ターンを誤って抑制しないようにする。

`dsh-mobile-maxxing` は `onlyMobileTurns: true`（既定）でスマホから送ったターンの `rpcId` を要求します。
goal ラウンドのメッセージは `source.kind: 'goal'` で `rpcId` を持たないため、こちらは元々 goal を通知しません。

## 修正履歴（2026-11-17）

抑制チェックの前に `goalTurns.delete(sessionId)` を実行していたため、
`goalTurns.has(sessionId)` が常に false になり、goal 中もターン完了通知が飛んでいました。

- 修正: `turn/end` で削除する前に `fromGoal` を読み取り、それで判定する。
- 回帰テスト: `test/harness.mjs` の step 12/13（goal ターンは無音、次の通常ターンは通知）。
- 検証: `node test/harness.mjs` → `ALL CHECKS PASSED`。
- テストの前提: `@deepseek-ai/schemastery` が必要。実機では
  `node_modules` を DSH 本体の `node_modules` へシンボリックリンクして実行している
  （`node_modules/` はリポジトリ除外）。

## 反映手順

linked plugin は HMR の監視対象外のため、ソース変更はサービス再起動で反映します。
再起動すると agentrouter 上のセッションは切断されます。

```bash
systemctl --user restart dsh-web-agentrouter
systemctl --user is-active dsh-web-agentrouter
```
