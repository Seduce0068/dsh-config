# VSCode グローバル設定（user / Kubuntu 2026.04）

`~/.config/Code/User/` と `~/.vscode/` の実稼働設定のバックアップ、および
公開参照用の設定例・拡張機能リスト。

## 構成

```
vscode/
├── config/
│   ├── settings.json            # ~/.config/Code/User/settings.json（実設定）
│   ├── keybindings.json         # ~/.config/Code/User/keybindings.json（実設定）
│   └── vscode-cli-settings.json # ~/.vscode/settings.json（CLI 側設定）
├── mcp.example.json             # MCP サーバ設定例（既存）
├── settings.example.jsonc       # 公開参照用の設定例（パスを ${env:HOME} に置換）
├── extensions.txt               # code --list-extensions の出力（104 件）
└── README.md
```

## 復元手順

```bash
# 1. 設定ファイル
cp vscode/config/settings.json ~/.config/Code/User/settings.json
cp vscode/config/keybindings.json ~/.config/Code/User/keybindings.json
cp vscode/config/vscode-cli-settings.json ~/.vscode/settings.json

# 2. 拡張機能
cat vscode/extensions.txt | xargs -r -n1 code --install-extension

# 3. MCP サーバ設定
#    mcp.example.json を参考に ~/.config/Code/User/mcp.json を作成する。
#    トークンは Input 変数（${input:github-token}）で参照し、実値は書かない。
```

## 秘密情報の方針

- `~/.config/Code/User/mcp.json` には `GITHUB_TOKEN` / `TAVILY_API_KEY` /
  `Authorization` / `password` が含まれるため、**リポジトリには含めない**。
  代わりに `mcp.example.json` の Input 変数方式を使う。
- `config/` 配下の実設定には秘密情報を含まないことを確認済み
  （`grep -riE '(token|password|secret|api[_-]?key|authorization)'` で hit なし）。
- 公開時は `settings.example.jsonc` と `mcp.example.json` のみを対象にし、
  `config/` 配下は private リポジトリ内に留める。

## 検証

```bash
# JSON 構文チェック（JSONC はコメントを許容するため jq は example のみ）
jq empty vscode/mcp.example.json
python3 -c 'import json,sys; json.load(open(sys.argv[1]))' vscode/config/settings.json
```
