# 最終環境サマリ（2026-11-08 19:08 完成）

パスキー認証ゲート導入と安全対策が完了し、**健康点検の全項目が OK（WARN/FAIL 0）**。

## 1. 公開構成（すべてパスキー必須・tailnet限定）

| 入口 | 通過するゲート | 行き先 | 未認証 |
|---|---|---|---|
| `https://<host>/` | oauth2-proxy-web (:14182) | DSH web :3080 | 302 |
| `https://<host>:8445/` | oauth2-proxy-agent (:14181) | DSH agentrouter :3081 | 302 |
| `https://<host>:8443/` | 入口Caddy (:14443) | Pocket ID | discovery 200／`/setup` 404 |

- 旧 `/agent/...` は **308** で `:8445` へ（ブックマーク互換）。
- Tailscale Serve がTLS終端（funnel無効）。LAN直通は不可。内部待受はすべて127.0.0.1。

## 2. 認証・セッション

- Pocket ID 2.19.2（パスキー）。OAuth2 Proxy 7.15.6。Caddy 2.11.9。イメージはdigest固定。
- issuer/JWKSは公開HTTPSで厳格検証、メール未確認の許容なし、PKCE S256。
- **セッション30日＋1時間毎リフレッシュ**（同一端末では再認証ほぼ不要。Google方式）。
- ゲートCookie名をweb/agent/stagingで分離。Host検証(400)・認証ヘッダ伝播あり。
- DSH自身の起動トークン＋署名Cookieは維持（二段目）。

## 3. 権限（最小化済み）

- **sudo**: 任意コマンド不可。許可は `dsh-root-helper`（固定操作）と `snap`/`apt`/`apt-get`（自動更新）のみ。
- **dockerグループ**: `koppe` から解除。ゲートは **rootのシステムunit** で起動。
  - 実測: dockerグループメンバー空、GID129を持つプロセス **0**。
- opencode: **127.0.0.1:49374** のみ。tailnet遮断ルールは多層防御として残置。

## 4. 自動化（systemd）

| 仕組み | 頻度 | 内容 |
|---|---|---|
| `dsh-passkey-stack.service`（system） | 起動時 | ゲート一式をrootで起動。冷間起動で1秒復旧を実証 |
| `dsh-passkey-watchdog.timer` | 2分毎 | 異常時のみ復旧＋Serveマッピング自動復元 |
| `dsh-backup-offsite.timer` | 毎日04:00 | 設定・DB・会話履歴・sudoers・unitを外付けext4へ（10世代） |
| `dsh-health-report.timer` | 毎日08:00 | 21項目点検を `docs/health.log` へ |
| Timeshift（cron） | 週次2世代 | 外付けext4（TS-BACKUP）へシステムスナップショット |

## 5. 復旧・バックアップ

- Pocket ID DB: 無停止の整合スナップショット。**復元ドリルで実起動まで検証済み**。
- 設定・sudoers・system unit・更新ラッパーもバックアップに同梱。
- Timeshift: 初回スナップショット `2026-11-08_17-48-27`（124G使用／空き312G）。
- 退避物: `~/vm_backup-archive-20261108`（旧NTFSから退避、ハッシュ一致）、旧バックアップ世代。

## 6. 直近の状態（実測）

- kernel **7.0.0-43-generic**／reboot-required なし
- ゲート ping **200×3**、`/` 302、`:8445` 302、discovery 200
- **失敗system unit 0件**
- 健康点検: **全項目OK**
- バックアップ: 9.1M・検証OK

## 7. 残タスク（完了 2026-11-08 19:11）

- 旧 `/agent` の恒久維持: 308リダイレクトを確認し、健康点検に追加。
- 自動更新の実効確認: `--dry-run` で全レーン成功（apt/snap/npm/cargo/flatpak/fwupd）。
- → **未対応の残タスクはなし。**

## 8. 運用メモ

- 手動の `docker` / 任意の `sudo` は**パスワード入力**が必要（意図した制限）。
- 端末紛失時は、ブラウザCookie削除またはPocket IDでユーザー無効化。
- 健康点検は `cat .../docs/health.log`、または `systemctl --user start dsh-health-report.service` で即実行。
- 主な資料: `docs/security-posture.md`、`docs/backup-restore.md`、`docs/timeshift-decision.md`、
  `docs/sudoers-stage2-applied.md`、`docs/current-state-2026-11-08.md`

## 9. GitHub MCP（2026-11-08 追加）

- リモートMCP（`https://api.githubcopilot.com/mcp/`）に接続し、`mcp__github__*` ツールを有効化。
- ツールセット: `repos,pull_requests,issues`。API経由のコミット・PR作成が可能。
- トークンは `~/.config/opencode/dsh.env`（0600）の環境変数で保持（設定に直書きしない）。
- 検証済み: `list_commits` で実リポジトリのコミット取得に成功。
- 詳細: `docs/github-mcp.md`

## 10. GitHubリポジトリ棚卸しの自動化（2026-11-08 追加）

- `scripts/github-inventory.sh`: ローカルGitとGitHubを突合し、未コミット・未push・未cloneをレポート。
- 毎週月曜09:00のタイマー（`dsh-github-inventory.timer`）で自動更新。
- 出力: `docs/github-inventory-latest.md`（読み取り専用・トークンは表示しない）。
- 報告例: 未コミット6件 / 未push 0件 / 未clone 0件（クローン済み）。
- 未cloneだった5件＋追加判明5件を `<home>/repos/onoderakeita/` にクローン済み（計10件）。
- PATをAll repositoriesへ更新し、23リポジトリがAPI/MCPから可視。
- リモートなしだった workspace / knowledge もprivateリポジトリ化してpush済み。
- 初回棚卸しの結果、jarvisをコミット＋rebase＋push、作業用/-をローカルコミット。

## 11. リポジトリ整理（2026-11-08 23:42）

- 旧重複クローン削除、OpenCodeRustの修正をforkへ、Policyの`.opencode/`をignore化。
- 詳細: `docs/current-state-2026-11-08.md` の §40。
