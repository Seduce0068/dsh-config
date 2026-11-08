# Muse 連携メモ

- Museアプリに「MCPサーバー追加」設定はない。依頼するとVM上にMCPクライアントを生成し、Skillとして保存する。
- **localhostは到達不可**。Remote Streamable HTTP（公開HTTPS）のみ。
- 認証はSecure Credential Flow（Bearer/APIキー）またはOAuth。秘密をチャットに貼らない。
- 最初はread-onlyで接続し、書き込みは承認付きで段階開放。
- Muse Codeは`~/.config/muse/settings.json`の`mcpServers`で直接接続できる（OAuth 2.1対応）。
