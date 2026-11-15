# Zed 設定（ koppe / Kubuntu 2026.04 ）

`~/.config/zed/` の実稼働設定と、DSH ACP / dsh-TUI 用ラッパーのバックアップ。
Zed 1.27 → 1.28 で運用中。

## 構成

```
zed/
├── config/
│   ├── settings.json   # ~/.config/zed/settings.json
│   ├── keymap.json     # ~/.config/zed/keymap.json
│   └── AGENTS.md       # ~/.config/zed/AGENTS.md（Zed Agent 個人指示）
├── tasks/
│   └── tasks.json      # ~/.config/zed/tasks.json
├── local-bin/
│   ├── dsh-acp         # ~/.local/bin/dsh-acp（ACP ラッパー、700）
│   └── dsh-tui         # ~/.local/bin/dsh-tui（TUI ラッパー、700）
└── settings.example.jsonc  # 最小設定例（公開参照用）
```

## 復元手順

```bash
# 1. 設定ファイル
cp zed/config/{settings.json,keymap.json,AGENTS.md} ~/.config/zed/
cp zed/tasks/tasks.json ~/.config/zed/tasks.json

# 2. ラッパー（DSH ACP / dsh-TUI 用）
cp zed/local-bin/dsh-{acp,tui} ~/.local/bin/
chmod 700 ~/.local/bin/dsh-acp ~/.local/bin/dsh-tui
ln -sfn dsh-tui ~/.local/bin/dst

# 3. Zed を起動 → 拡張は auto_install_extensions で自動導入
zed ~/document/deepseek-harness/default-workspace
```

## 前提（別途必要）

- `~/.config/opencode/dsh.env`（600）: DeepSeek 等の API キー。ラッパーが読む（本リポジトリには含めない）。
- DSH CLI（`~/.npm-global/bin/dsh`）と dsh-TUI（`@deepseek-harness-tui/dsh-tui`）のインストール。
- DSH プロファイル `~/.dsh-agentrouter/profiles/{acp,dsh-tui}` の初期化（初回起動で自動）。

## 安全方針

- **秘密情報は一切含めない**。`settings.json` の `agent_servers` は `command` パスのみで、API キーはラッパー経由で env から渡す。
- `local-bin/dsh-*` は env ファイルを `source` するだけで、キーをハードコードしない。
- `.gitignore` で `.env` / `*.key` / `*.pem` / `*.token` / `*.db` を除外済み。

## 詳細

- 設計意図・検証結果: `passkey-gateway/docs/zed-setup-2026-11-10.md`（DeepSeek Harness ワークスペース内）
- dsh-TUI: `passkey-gateway/docs/dsh-tui-setup-2026-11-10.md`
