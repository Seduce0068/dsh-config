# dsh-ntfy-notify

DeepSeek Harness の **承認待ち / 質問待ち / ターン完了** を、スマホ（Galaxy S26 Ultra）の
ntfy 通知として受け取るためのプラグインです。ブラウザを閉じていても PC から離れていても届きます。

- ホスト側（`lib/index.js`）: DSH のイベントを監視して ntfy へ HTTP publish
- ブラウザ側（`lib/client.js`）: いま見ているセッションとタブ状態をホストへ報告
  （見ている間は通知しない "away" 判定用）

## 通知されるイベント

| イベント | 送信条件 | 例 |
| --- | --- | --- |
| 承認待ち | そのセッションを誰も見ていないとき | `承認待ち: bash` / `rm -rf build` |
| 質問待ち | そのセッションを誰も見ていないとき | `質問待ち: sess-…` / 質問文 |
| ターン完了 | DSH のどのタブも前面に無いとき | `ターン完了: …` / `ターン 3 が完了しました` |

- サブエージェント（子セッション）の完了は通知しません（親の完了に集約）。
- 同一起因の通知は再接続しても再送しません（30 分のメモリで重複排除）。
- 承認待ち・質問待ちは通知欄に残り、30 分で失効します（os `X-Expires`）。

## セットアップ

### 1. スマホ側（Termux）

```bash
pkg install ntfy        # または F-Droid / Play ストアの ntfy アプリ
ntfy subscribe "dsh-<ランダム文字列>"
```

トピック名は他人に推測されにくいランダム文字列にしてください（ntfy.sh はトピック名を知っていれば誰でも購読できます）。
自分専用サーバーを使う場合は `server` にその URL を設定します。

### 2. PC 側（プロファイル設定）

`~/.dsh/profiles/web/cordis.patch.yml` の末尾に追加:

```yaml
- id: ntfy-notify
  config:
    server: 'https://ntfy.sh'
    topic: 'dsh-<ランダム文字列>'   # スマホと揃える
    sound: true
```

ntfy のアクセストークンを使う場合だけ `token: '...'` も設定（`Authorization: Bearer` で送信）。

### 3. 反映

```bash
systemctl --user restart dsh-web.service
```

### 4. 動作確認

```bash
# 送信だけを手で確認
curl -H "Title: test" -d "ntfy-notify のテスト" https://ntfy.sh/dsh-<ランダム文字列>

# プラグインのログ
DSH_NTFY_DEBUG=1 dsh web --no-open --port 3199
journalctl --user -u dsh-web.service -f | grep ntfy-notify
```

## 設定項目

| キー | 既定 | 意味 |
| --- | --- | --- |
| `server` | `https://ntfy.sh` | ntfy のベース URL |
| `topic` | 空 | 購読トピック。空だと通知しない（警告ログのみ） |
| `token` | 空 | アクセストークン（任意） |
| `sound` | `true` | `X-Sound: default` を付ける |
| `notifyApproval` | `true` | 承認待ちを通知する |
| `notifyQuestion` | `true` | 質問待ちを通知する |
| `notifyTurnComplete` | `true` | ターン完了を通知する |

## 制約

- ブラウザ側の報告は `POST /api/ntfy-notify/presence`。DSH の認証済みセッションから送ります。
- ブラウザを起動していない間は「誰も見ていない」扱いになるため、承認・質問・完了はすべて届きます。
- ntfy.sh は通知本文を平文で扱います。機密性が必要なら自前サーバーかトピック名の管理に注意してください。

## テスト

```bash
node test/harness.mjs
```

ntfy の代わりにローカルのモックサーバーを立て、3 イベント・重複排除・away 判定・
子セッション除外・失敗ターンを検証します（外部通信なし）。
