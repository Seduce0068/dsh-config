# opencode 固有指示

共通指示の正本は `~/.agents/AGENTS.md`（opencode は `opencode.jsonc` の `instructions` で読み込む）。
このファイルは opencode に固有の事項だけを書く。

## 1. 設定とファイル配置

- グローバル設定: `~/.config/opencode/opencode.jsonc`。秘密情報を含むため git では追跡しない。
- グローバルTODO: `~/.config/opencode/todo.md`（opencode 設定リポジトリの一部として git 管理）。
  - 複数プロジェクト横断のタスクを置き、プロジェクト固有TODOと混在させない。
  - 見出しは `進行中` / `未着手` / `完了` / `メモ` を維持する。未着手は優先度 高 → 中 → 低 の順に並べる。
  - 作業開始時と完了時に参照し、状態の移動とチェックボックスを更新する。
  - memory MCP へ内容を複製せず、所在と運用だけを記憶する。秘密情報・認証情報・非公開URLは書かない。
  - 変更は git にコミットする。書式は `.markdownlint-cli2.jsonc` に従う。
- サブエージェント定義: `~/.config/opencode/agents/`、コマンド: `~/.config/opencode/commands/`。
- スキルの探索パス（opencode仕様）: グローバルは `~/.config/opencode/skills`、
  互換で `~/.claude/skills` と `~/.agents/skills`、プロジェクトは `.opencode/skills` /
  `.claude/skills` / `.agents/skills` 等。同一IDは後登録のソースが優先されるため、
  意図的な上書き以外で重複IDを作らない。
  - 個人スキルの正本は `~/.agents/skills`（`~/.config/opencode/skills` は2026-11-12に廃止）。
- opencode 標準スキル（`find-skills` / `opencode` / `report`）: スキルの探索・インストール、opencode本体の仕様確認、不具合報告に使う。新しいスキルのインストールはユーザー承認後に行う。
- シェル実行ツール: `shell`（対話・検証）、`bash`（背景実行）。ファイル操作は `read` / `write` / `edit` / `glob` / `grep`、スキルは `skill`、委譲は `subagent`。

## 2. サブエージェント（opencode固有）

定義は `~/.config/opencode/agents/` に置き、実行時に提示された一覧と `description` に従って選択する。

### 定義と権限

- `arch-reviewer` / `ops-reviewer` / `security-reviewer` は読み取り専用を既定とする。
  `read` / `glob` / `grep` は allow、`edit` / `shell` / `subagent` は deny。
- 書き込みやコマンド実行を要する委譲は、必要性を説明できる場合のみ行い、サブエージェント定義側で明示的に許可する。
- `model` はサブエージェント定義の指定を既定とし、ユーザーの明示指定がない限り上書きしない。軽量モデルは探索・レビュー、統合判断は親が担う。
- `steps`・`hidden` の解除など能力を増やす設定変更はユーザーの承認を得てから行う。能力を減らす変更（`disabled` 化・権限縮小）は確認不要。

### 必須トリガー

- コード差分を伴うレビュー依頼（「レビューして」「確認して」「マージ前」「検査」「チェック」等）では、
  明示指示がなくても `cross-review` スキルを読み込み、`arch-reviewer`・`ops-reviewer`・
  `security-reviewer` を並列起動する。
- 起動対象は、意味的変更・10行以上のコード差分・セキュリティ/認証/決済/データ破壊。typo・整形・renameのみ・1〜3行・コメントのみ・文書のみの変更では起動しない。判断理由を短く示す。
- 起動した場合は、統合レポートを親エージェントが最終判断に使う。委譲先の指摘を無条件に採用しない。

### 運用

- 同一タスクの継続は既存の子セッションを再利用し、新規セッションでの重複質問を避ける。
- `cross-review`・`review-flow`・`test-spec`・`ai-selection` 系のコマンドは `subagent: true` を宣言しているため、これらを優先する。

## 3. MCP 利用方針（opencode固有）

MCPは調査・操作の補助ツールとして使用する。ローカル情報を優先し、呼び出しは
Code Mode（`execute` 内の `tools[...]`）経由で行う。ツール名は推測せず `search` で確認し、
各サーバの `mcp_instructions` が提示されている場合はそれに従う。
共通原則は `~/.agents/AGENTS.md` の「MCP・外部ツールの一般原則」に従う。

### サーバ別用途

| サーバ | 用途 | 備考 |
| --- | --- | --- |
| `context7` | ライブラリ/CLI/クラウドの公式ドキュメント | リモートMCP。調査の第一候補 |
| `exa` | Web検索・ページ取得 | 最新情報、一般調査 |
| `tavily-mcp` | 深掘りリサーチ | 広範なトピックの横断調査 |
| `deepwiki` | 外部GitHubリポジトリの理解 | OSSの構造・設計調査 |
| `lsp` | ローカルコードの意味解析 | 定義、参照、型、診断 |
| `serena` | LSPベースの意味解析・編集（REPL） | シンボル検索、参照、リネーム。初回に `initial_instructions` |
| `playwright` | ブラウザ自動化・E2E | headless既定 |
| `chrome-devtools` | 実ブラウザデバッグ | 性能、ネットワーク、CDP |
| `memory` | セッション横断の知識保存 | 機密情報は保存しない |

### memory サーバの運用

memoryは自動で想起・保存される仕組みではなく、モデルが次の基準に従って明示的に呼び出す。呼び出しは Code Mode（`execute` 内の `tools.memory`）経由とする。

- 想起: セッション開始時、または過去の判断・環境が前提になりそうな場合に限り `search_nodes` を原則1回実行する。候補は `open_nodes` で本文を確認してから使う。想起内容は Runtime Proof より優先しない。
- 保存: 次回以降に再利用する「判断」「環境」「手順」「却下理由」に限定する。
  一時的な作業ログ・進捗・TODOの正文は保存しない（TODOは `~/.config/opencode/todo.md` が正）。
  秘密情報・認証情報・非公開URL・非公開コードは保存しない。
  `entityType` は `判断`・`環境`・`手順`・`却下`・`候補`・`記録` の固定語彙を使う。
  既存ノードは `open_nodes` で確認して重複作成を避け、追記は `add_observations`、
  新規のみ `create_entities`、関係は `create_relations` を使う。
- 変更と削除: `delete_entities` / `delete_observations` / `delete_relations` はユーザー確認後に実行する。誤って保存した機密情報は確認を待たず削除し、その旨を報告する。

### ツール選択の自動判断

利用者に「どのMCPを使うか」を確認しない。次の表で自動決定する。

| 状況 | 選択 | 判断基準 |
| --- | --- | --- |
| ライブラリ/API/CLIの仕様 | `context7` | バージョン付き一次情報が必要 |
| 一般的な最新情報 | `web_search_exa` | 意味検索で足りる |
| ドメイン/日付/カテゴリ指定 | `web_search_advanced_exa` | フィルタが必須 |
| 通常の事実確認 | `tavily_search` basic | 低コストで十分 |
| ニッチ/直近/多面 | `tavily_search` advanced | 網羅性が必要 |
| 複数ソースの統合・比較 | `tavily_research` | 調査専用 |
| 既知URLの本文 | `web_fetch_exa` | 一括取得が速い |
| JS/表/保護ページ | `tavily_extract` advanced | 抽出成功率が高い |
| サイト構造/一括収集 | `tavily_map` → `tavily_crawl` | 範囲を制御できる |
| 公開コード例 | `gh search code` | 実装検索 |
| GitHub操作 | `gh` CLI | MCPより軽量 |
| ローカルコード | `lsp` | 意味解析 |
| OSSの設計/FAQ | `deepwiki` | リポジトリ知識 |
| ブラウザ操作/実機検証 | `playwright` / `chrome-devtools` | 操作と診断で使い分け |

判断ルール:

- ローカルで解決できる調査にはMCPを使わない。
- 安い選択肢から試す（`basic` → `advanced` → `research` / `crawl` の順）。`advanced` は、日付・ドメイン・カテゴリのフィルタが必須、`basic` の結果不足または直近/ニッチ、表・埋め込み・JS依存ページの抽出、複数ファセットを1回で網羅する必要がある場合だけ使う。
- 同じ検索を exa と tavily に重複して投げない。失敗時は別プロバイダを1回だけ試し、連続リトライしない。結果が足りない場合だけ一段階上げる。
- `context7` は `resolve-library-id` → `query-docs` の順で使い、`topic` とバージョンを指定する。
- 組み込み `websearch` は無効。URL取得が必要なら `webfetch` を使う。複雑タスクの分解はモデル内蔵の推論で行う。

### ファクトチェックとグラウンディング

- 事実確認は「仕様=context7 / 最新=exa / 横断=tavily」でルーティングし、最終主張は一次情報（公式docs、changelog、release notes、RFC、原典）で確認する。
- 検索の要約・ハイライトは証拠ではなくポインタとして扱い、引用は原文から取る。

## 4. 仕様リファレンス

- スキル仕様: <https://opencode.ai/v2/docs/skills>
- エージェント仕様: <https://opencode.ai/v2/docs/agents>
