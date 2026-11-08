# AGENTS.md（正本テンプレート）

このリポジトリは個人環境の**設定・環境情報の正本**であり、AGENTS.mdの単一ソースでもある。
各ツール（DSH/opencode/Zed/VSCode）はこの内容を参照し、指示の二重管理を避ける。

## 基本原則
- 安全第一: 秘密情報を出力・コミットしない。破壊的操作は対象確認とバックアップの後に実施。
- 権限: root操作は提示のみ（自分で実行しない）。sudo/ dockerの制約を尊重する。
- 検証: 変更後はコマンドで結果を確認し、根拠を示す。
- 質問: 曖昧な場合は1つだけ確認する。
- 言語: 日本語。簡潔・具体的に。

## 開発規約
- コミットは1論理変更ずつ。テスト/lint（fmt/check/test/clippy等）を通す。
- 生成物・秘密・ローカル設定は`.gitignore`で除外。
- ドキュメントは実装と同じコミットで更新する。

## ツール別の指示ファイル
- VSCode: `.github/copilot-instructions.md`（このAGENTS.mdを参照）
- opencode: プロジェクトrootの`AGENTS.md`（本ファイル）、個人設定は`~/.config/opencode/AGENTS.md`
- DSH: ワークスペースの`AGENTS.md`＋`~/.agents/AGENTS.md`
- Zed: 個人`~/.config/zed/AGENTS.md`＋プロジェクトの`AGENTS.md`
- Muse: ファイル方式なし（Custom Connector / Skillで指示）
