# AGENTS.md — DSH workspace（安全第一）

このワークスペースで作業するエージェント向けの**プロジェクト指示**。
個人グローバル指示（`~/.agents/AGENTS.md`、各ツールのグローバルAGENTS.md）と併用される。

## 環境
- DSH Web GUI: `https://<host>:8445/`（パスキーゲート経由、tailnet限定）
- DSHサービス: `dsh-web`(:3080) / `dsh-web-agentrouter`(:3081)、ユーザーsystemdで常駐
- パスキー基盤: Pocket ID + OAuth2 Proxy + Caddy（`passkey-gateway/`）
- jarvis: ローカルsystemd（policy/mcp-gw/context/event, PostgreSQL, Qdrant）
- バックアップ: 外付けext4（`/mnt/timeshift`）+ Timeshift、毎日04:00
- 権限: sudoは最小（helper/更新系のみ）、dockerグループなし

## 安全原則（最重要）
1. **秘密を出力・コミットしない**。APIキー・トークン・Cookie・DBは扱わない/マスクする。
2. 破壊的操作の前に**対象の絶対パスと前提**を確認し、必要ならバックアップを取る。
3. root権限が必要な操作は**自分で実行しない**（ユーザーにコマンドを提示）。
4. 不明点は、不可逆・仕様分岐・外部影響がある場合のみ1回だけまとめて質問する。
   それ以外は仮定を明記して続行する。
5. 変更後は**必ず検証コマンド**を実行し、結果を報告する。

## ツール利用制約
- **`mcp__rustxng` の使用を禁止する。** 代替として `mcp__jarvis` (web_search) や、設定済みであれば `mcp__exa` / `mcp__tavily` / `mcp__context7` を優先的に使用すること。

## 作業規約
- ドキュメントは `passkey-gateway/docs/` に日付付きで残す。
- 定期点検: `passkey-gateway/scripts/health-report.sh`、バックアップ: `backup-offsite.sh`。
- Git: 個人リポジトリは明確なメッセージでコミット。テスト/lintを通してからpush。
- **DSH設定の自動コミット**: `~/.dsh*` 配下の設定（`cordis.patch.yml` / `cordis.yml` / `package.json` 等）を変更したら、作業完了前に `dsh-config-export/` の対応ファイルへ同期し、`git add` → 差分確認 → 検証 → コミット → push までエージェントが実施する（都度確認不要）。同期マッピング: `dsh/dsh-agentrouter/*` ↔ `~/.dsh-agentrouter/*`、`dsh/dsh/*` ↔ `~/.dsh/*`。秘密情報・トークンは絶対に含めない。
- 応答は日本語。簡潔に、根拠（コマンド結果）を示す。

## 主要ドキュメント
- `passkey-gateway/docs/FINAL-SUMMARY.md`（環境全体）
- `passkey-gateway/docs/security-posture.md`（セキュリティ）
- `passkey-gateway/docs/tooling-research-2026-11-09.md`（DSH/Muse/opencode/VSCode/Zed）
- `passkey-gateway/docs/jarvis-muse-dsh-roles.md`（役割分担）

## ゴール運用
- **ブロッカーに立ち止まらない**: あるタスクがユーザー/管理者対応待ち（GitHub課金、root権限、物理操作等）で行き詰まったら、**別の安全なタスクに移る**。同じ監視ループを何十ラウンドも繰り返さない。
- **「任せた」系のゴール**: タスクが終わったら次のタスクを探して実行するのが意図。ブロッカーで止まって監視だけ繰り返すのは意図に反する。デバッグ・機能追加・リファクタ・ドキュメント整備など、自律的に進められる作業を探して実行する。
- **ブロッカーの報告**: ブロッカーが3ラウンド以上持続する場合は、blocked を申請せず、ユーザーに簡潔に報告した上で別のタスクに移る。blocked は「同じ条件が3ラウンド以上持続し、かつ他にできる安全なタスクもない」場合のみ。

## 既知の制約
- Tailscale依存（脱却は設計中）。ドメイン未購入。
- OCIのjarvis-hostは削除予定（データ移行不要）。
- DSH↔jarvisのMCP接続はjarvis側のデプロイ待ち（要root）。
- **GitHub Actions 課金制約**: `Seduce0068/gpui-task-manager` は public だが、アカウントの spending limit / 支払い方法の問題で Actions ジョブが開始されない状態が継続中（2026-11-16時点）。解決にはユーザーが https://github.com/settings/billing で支払い方法/上限を確認・更新する必要がある。CI未実行でもローカル検証（fmt/clippy/test）は全件通過している。
