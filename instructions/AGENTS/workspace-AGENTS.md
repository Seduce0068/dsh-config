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
4. 不明な点は独断で進めず、1つだけ質問する。
5. 変更後は**必ず検証コマンド**を実行し、結果を報告する。

## 作業規約
- ドキュメントは `passkey-gateway/docs/` に日付付きで残す。
- 定期点検: `passkey-gateway/scripts/health-report.sh`、バックアップ: `backup-offsite.sh`。
- Git: 個人リポジトリは明確なメッセージでコミット。テスト/lintを通してからpush。
- 応答は日本語。簡潔に、根拠（コマンド結果）を示す。

## 主要ドキュメント
- `passkey-gateway/docs/FINAL-SUMMARY.md`（環境全体）
- `passkey-gateway/docs/security-posture.md`（セキュリティ）
- `passkey-gateway/docs/tooling-research-2026-11-09.md`（DSH/Muse/opencode/VSCode/Zed）
- `passkey-gateway/docs/jarvis-muse-dsh-roles.md`（役割分担）

## 既知の制約
- Tailscale依存（脱却は設計中）。ドメイン未購入。
- OCIのjarvis-hostは削除予定（データ移行不要）。
- DSH↔jarvisのMCP接続はjarvis側のデプロイ待ち（要root）。
