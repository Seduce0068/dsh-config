# ツール別 指示ファイル対応表

| ツール | 読むファイル | 本リポジトリの扱い |
|---|---|---|
| DSH | `AGENTS.md`/`CLAUDE.md`（階層＋`~/.agents/AGENTS.md`） | プロジェクト/ワークスペースに配置 |
| opencode | プロジェクト`AGENTS.md`＋`~/.config/opencode/AGENTS.md` | プロジェクトは本リポジトリのAGENTS.mdを参照 |
| Zed (Zed Agent) | `~/.config/zed/AGENTS.md`＋プロジェクト候補（`.rules`→…→`AGENTS.md`） | 個人ファイルは環境側、プロジェクトはAGENTS.md |
| Zed (External Agent) | エージェント自身のnative設定 | Zed側の指示は届かない点に注意 |
| VSCode (Copilot) | `.github/copilot-instructions.md`または`AGENTS.md` | 薄い参照ファイル＋AGENTS.md |
| VSCode (Claude/Codex) | `CLAUDE.md`/`AGENTS.md` | 必要時のみ互換ファイル |
| Muse | ファイル方式なし（Skill/Custom Connector） | 指示はSkillに保存 |

## 原則
- **正はリポジトリrootの`AGENTS.md`**。他は参照か最小限の互換ファイル。
- 秘密情報は指示ファイルに書かない（環境変数/secret store）。
- 指示は短く、非自明な規約と検証コマンドに絞る。

## バックアップ（2026-11-09 追加）
- `AGENTS/`: 個人・ツール別AGENTS.mdのコピー（sanitized）
- `skills/`: 個人Skillsのコピー（canonical: `~/.config/opencode/skills`）
- これらは復元用の控え。正本は各ホームのファイル。
