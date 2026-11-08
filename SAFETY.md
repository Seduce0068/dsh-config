# 除外・マスクした情報

以下は**このリポジトリに含めていません**。

## 完全に除外
- `/home/koppe/.config/opencode/dsh.env`（APIキー・GITHUB_MCP_TOKEN等）
- `passkey-gateway/oauth2-proxy/oauth2-proxy.env`、`pocket-id/pocket-id.env`、`register/pocket-id.env`
- Pocket ID の DB（`*.db`）とバックアップ
- DSHのセッション/会話履歴（`~/.dsh*/sessions`, `storages`）
- `inbox/`（ワンタイムURL・トークンを含む）
- ログ（`docs/*.log`）

## マスク
- 公開IPv4 → `<PUBLIC_IP>`
- tailnet IPv4（100.x）→ `<TAILNET_IP>`
- `?token=...` → `?token=<REDACTED>`
- `Bearer ...` → `Bearer <REDACTED>`
- `github_pat_*` / `sk-*` 等 → `<REDACTED>`

## 環境変数
`.env.example` に**変数名のみ**を記載（値は空）。
