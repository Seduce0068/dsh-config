# 除外・マスクした情報

以下は**このリポジトリに含めていません**。

## 完全に除外
- `<home>/.config/opencode/dsh.env`（APIキー・GITHUB_MCP_TOKEN等）
- `passkey-gateway/oauth2-proxy/oauth2-proxy.env`、`pocket-id/pocket-id.env`、`register/pocket-id.env`
- Pocket ID の DB（`*.db`）とバックアップ
- DSHのセッション/会話履歴（`~/.dsh*/sessions`, `storages`）
- `inbox/`（ワンタイムURL・トークンを含む）
- ログ（`docs/*.log`）

## マスク
- 公開IPv4 → `<PUBLIC_IP>`
- tailnet IPv4（100.x）→ `<TAILNET_IP>`
- tailnet ドメイン → `<tailnet>`、tailnet ホスト名（旧アカウント由来のホスト名を含む）→ `<host>.<tailnet>`
- LAN 内部 IPv4（10/8・172.16/12・192.168/16）→ `<private-ip>`
- Docker bridge ID → `<bridge-id>`
- プロセス ID（`pid=...`）→ `<pid>`
- メールアドレス → `<email>`
- ntfy トピック → `${env:NTFY_TOPIC}`（実値は環境変数 `NTFY_TOPIC` で管理）
- `?token=...` → `?token=<REDACTED>`
- `Bearer ...` → `Bearer <REDACTED>`
- `github_pat_*` / `sk-*` 等 → `<REDACTED>`
- 旧アカウント名 → `<account>`（実行用スクリプトの照合対象のみ現行アカウント名に置換）
- 非公開リポジトリ名 → `<private-repo>`、リポジトリ件数 → `<count>`、コミットハッシュ → `<commit>`
- GPU型番/ドライバ/VRAM → `<gpu>` / `<driver>` / `<vram>`、ディスク装置名・容量・マウント先 → `<disk>` / `<size>` / `<mount>`、ディスクUUID → `<disk-uuid>`、IPv6 プレフィックス → `<ipv6>`、ルーター識別子 → `<router>`、ディスクラベル → `<label>`
- CPU/メモリ/マザーボード/筐体 → `<cpu>` / `<memory>` / `<motherboard>` / `<chassis>`、端末型番・回線・キャリア・プラン → `<phone>` / `<carrier>`（固有値は記載しない）

## 環境変数
`.env.example` に**変数名のみ**を記載（値は空）。
