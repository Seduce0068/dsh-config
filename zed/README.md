# Zed 設定（ user / Kubuntu 2026.04 ）

`~/.config/zed/` の実稼働設定と、DSH ACP / dsh-TUI 用ラッパーのバックアップ。
Zed 1.28（公式）と zed-i18n 1.29.2（日本語UIビルド）を併用中。
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
│   ├── dsh-tui         # ~/.local/bin/dsh-tui（TUI ラッパー、700）
│   └── zed-i18n        # ~/.local/bin/zed-i18n（日本語 UI ビルドの起動ラッパー、700）
├── restore-layout.py   # 3ペインレイアウト復元スクリプト
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

### 日本語 UI（zed-i18n ビルド）

公式 Zed は UI ローカライズをサポートしていないため、コミュニティビルド
`zed-i18n`（Zed 1.29.2 ベース、日本語訳を含む全 13 言語）を併用する。

```bash
# ラッパー配置（初回のみ）
cp zed/local-bin/zed-i18n ~/.local/bin/zed-i18n
chmod 700 ~/.local/bin/zed-i18n
# 起動
zed-i18n ~/document/deepseek-harness/default-workspace
```

表示言語は `~/.config/zed/settings.json` の `ui_locale` で固定する。

```jsonc
"ui_locale": "ja-JP"
```

`ui_locale` の値は `cs-CZ` / `de-DE` / `es-ES` / `fr-FR` / `it-IT` / `ja-JP` /
`ko-KR` / `pl-PL` / `pt-BR` / `ru-RU` / `tr-TR` / `zh-CN` / `zh-TW` のいずれか
（`en-US` を指定すると英語に戻る）。公式 Zed はこのキーを無視する。

注意:
- zed-i18n は `~/.config/zed/` と `~/.local/share/zed/` を公式 Zed と共有する。
  DB スキーマが 1.29 系に更新されるため、公式 1.28 に戻すと不整合が起きる可能性がある。
- zed-i18n は内蔵自動更新を無効化している（`ZED_UPDATE_EXPLANATION`）。更新時は
  リリースページから .deb / tar.gz を取得して `~/.local/zed-i18n/` を置き換える。
- zed-i18n はコミュニティビルドであり、Zed Industries の公式サポート対象外。

### パネルレイアウトの復元（VSCode 風 3ペイン）

Zed はパネル配置（左/右/下 と active panel）を SQLite DB
（`~/.local/share/zed/db/0-stable/db.sqlite` の `workspaces` テーブル）に保存する。
新規プロジェクトを開いた直後や、Zed 更新後にレイアウトが初期化された場合は
`restore-layout.py` で 3ペイン（左=Project Panel / 右=AgentPanel / 下=TerminalPanel）に戻せる。

```bash
# Zed を停止してから実行（稼働中は DB が上書きされる）
pkill -x zed-editor; sleep 2
python3 zed/restore-layout.py                                   # default-workspace
python3 zed/restore-layout.py /path/to/other-project            # 任意のプロジェクト
zed ~/document/deepseek-harness/default-workspace              # 再起動
```

バックアップは `db.sqlite.bak-<timestamp>` に自動作成。
ロールバック: `cp ~/.local/share/zed/db/0-stable/db.sqlite.bak-* db.sqlite`

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

## 参考: レイアウト永続化の仕組み（Zed 1.28.1 ソース調査）

- 開閉状態: `workspaces` テーブルの `{left,right,bottom}_dock_visible` / `{...}_active_panel`
- パネル名は各パネルの `Panel::persistent_name()`:
  `Project Panel` / `GitPanel` / `Outline Panel` / `TerminalPanel` / `AgentPanel`
- パネル幅: `scoped_kv_store` の `dock_panel_size` 名前空間に `{workspace_id}:{panel_key}` で保存
  （`project_panel` の panel_key は `ProjectPanel`、`agent_panel` は `agent_panel`、`terminal` は `TerminalPanel`）
- 保存タイミング: `serialize_workspace`（200ms throttle）— パネル開閉・リサイズ・ウィンドウ操作時
- 参照: `crates/workspace/src/{dock.rs,persistence/model.rs}`、`crates/workspace/src/workspace.rs`
