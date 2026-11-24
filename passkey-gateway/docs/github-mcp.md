# GitHub MCP リモートサーバー接続（2026-11-08 設定・検証済み）

## 構成
- DSH の `dsh-mcp-client` を **streamable-http** で GitHub ホスト型MCPへ接続。
- エンドポイント: `https://api.githubcopilot.com/mcp/`
- ツールセット: `repos,pull_requests,issues`（`X-MCP-Toolsets` ヘッダーで限定）
- 公開ツール名: `mcp__github__*`（例: `mcp__github__create_pull_request`）

## 設定箇所
1. トークン（fine-grained PAT）:
   - `~/.config/opencode/dsh.env`（0600）に `GITHUB_MCP_TOKEN=...`
   - 設定ファイルには**直書きしない**。`!!js '`Bearer ${process.env.GITHUB_MCP_TOKEN}`'` で参照。
2. プロファイルpatch（両方に同一ブロック）:
   - `~/.dsh/profiles/web/cordis.patch.yml`
   - `~/.dsh-agentrouter/profiles/agentrouter/cordis.patch.yml`
   ```yaml
   - insert:
       - id: mcp-github
         name: '@deepseek-ai/dsh-mcp-client'
         config:
           serverName: github
           transport: streamable-http
           url: https://api.githubcopilot.com/mcp/
           headers:
             X-MCP-Toolsets: repos,pull_requests,issues
             Authorization: !!js '`Bearer ${process.env.GITHUB_MCP_TOKEN}`'
           toolCallTimeoutMs: 60000
           failOnStartupError: false
   ```

## 検証（2026-11-08 21:37）
- `mcp__github__list_commits` で `<account>/<private-repo>` の実コミット3件を取得 → **接続・認証・読み取りOK**。
- トークン: fine-grained PAT / <count>リポジトリ / `push=true` を確認。
- 起動ログに MCP エラーなし。

## できること / できないこと
- できる: ファイル内容の取得、**API経由のコミット作成**（`create_or_update_file`/`push_files`）、
  ブランチ作成、PR作成・参照、Issue操作。
- できない: **ローカルの未pushコミットのpush**（それは `git push`）。MCPのコミットはAPI経由で新規作成。

## 権限・ローテーション
- PATは対象リポジトリと権限を最小化（Contents/PR の Read+Write、必要ならIssues）。
- 期限（例90日）。更新時は `dsh.env` の値を差し替え、DSHを再起動。
- 失効させたい場合: GitHubでトークン失効 → `dsh.env` から行削除 → 再起動。

## 運用メモ
- プロファイルpatchを編集すると **HMRが働きUIが一瞬再接続**する（設定反映は自動）。
- `dsh.env` の変更（env）はプロセス再起動が必要。
- `dsh.env` は秘密のためバックアップ対象外（設定patchはバックアップ対象）。

## E2Eテスト結果（2026-11-08 21:43）

実際にAPI経由でブランチ→コミット→PR作成まで実行し、成功を確認した。

| 操作 | 結果 |
|---|---|
| ブランチ作成 `mcp-connection-test` | 成功（起点 `<commit>`） |
| ファイルコミット（`MCP-TEST.md`） | 成功（commit `<commit>`） |
| PR作成 | 成功（[PR #1](https://github.com/<account>/<private-repo>/pull/1)、1ファイル/1コミット） |
| 後片付け | PRクローズ（**未マージ**）、ブランチ削除（API 204→404確認） |
| `master` | **無変更**（`<commit>` のまま） |

これにより「コミット作成・PR作成」の自動化が実動作で確認できた。

## 新規リポジトリ作成（2026-11-08 22:12）

- `<account>/<private-repo>`（private）を作成し、ローカル初回コミットをpush。
- `<account>/<private-repo>`（private）を作成し、旧`------`の壊れたremoteを置換してpush。

### 重要な制約（PATのスコープ）
- 現在のfine-grained PATは**「選択したリポジトリ」**スコープのため、**新規作成した<count>リポジトリはAPI/MCPから見えない**（404）。
  - git push / ls-remote は成功（書き込みは通る）。
  - `/user/repos` にも出ないため、棚卸しレポートでは「GitHub未確認」と表示される。
- 解消するには: https://github.com/settings/personal-access-tokens → 該当トークン →
  **Repository access に新規<count>リポジトリを追加**（または「All repositories」）。
- 以後、新規リポジトリを作るたびにPATの選択範囲更新が必要。
