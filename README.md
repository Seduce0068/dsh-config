# DSH 設定・環境情報（プライベート）

DeepSeek Harness（DSH）の設定と、このPCの環境情報をまとめた**バックアップ兼リストア資料**です。
生成日時: 2026-11-09 00:27 

## 重要（安全方針）
- **秘密情報は含めていません**。APIキー、トークン、Cookie、Pocket IDのDB、会話履歴、セッション、
  OAuth2 Proxy/Pocket IDのシークレット、`dsh.env` の実値は除外しています。
- 環境変数は「名前のみ」を `.env.example` に記載しています。
- ホスト名・LAN構成は含みますが、公開IPやtailnet IPはマスクしています。

## 検証
- `tools/check-config.sh`: 設定例（JSONC対応）・YAML（テンプレート除外）・リンクの静的検証。

## 収録内容
- `docs/approval-matrix.md`: 承認区分（確認不要／1回確認／明示承認）と完了定義
- `AGENTS.md`: 指示の正本テンプレート（ツール別参照は `instructions/`）
- `environment/`: OS/カーネル/ハードウェア/バージョン/待受ポート/ネットワーク概要
- `dsh/`: DSHのプロファイル構成（web / agentrouter / headless）、バージョン
- `systemd/`: ユーザーunit・システムunit（DSH/ゲート/監視/バックアップ）
- `passkey-gateway/`: パスキーゲートのcompose/Caddy設定、運用スクリプト、主要ドキュメント
- `.env.example`: 必要な環境変数の**名前のみ**

## 再現の考え方
1. このPCの環境（Kubuntu/DSH）を再構築する際の参照資料。
2. 秘密は別管理（パスワードマネージャ等）から投入する。
3. 手順の詳細は `passkey-gateway/docs/` を参照。
