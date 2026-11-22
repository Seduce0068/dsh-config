---
type: Todo
title: "dsh-config-export プロジェクトTODO"
description: "dsh-config-export 固有のタスク。横断タスクはグローバルTODOへ。"
tags:
  - todo
  - tasks
  - "dsh-config-export"
generated:
  by: opencode
  at: "2026-11-17T20:11:47+09:00"
status: current
---

## 進行中

- [ ] 上流 `deepseek-ai/deepseek-harness` で `SessionListRequest.cursor` を実装し、差分 list を実現する（要ユーザー承認でフォーク／PR）
- [ ] 実装後に `session.list` / `session.follow` の呼出回数と転送量を before/after 計測する

## 未着手

### 優先度: 高

- [ ] 会話履歴の差分化（follow への cursor 追加。list 差分の実測後）

### 優先度: 中

- [ ] 先描画ハックの副作用を上流実装へ持ち込まないことをレビューで確認する

### 優先度: 低

（なし）

## 完了

- [x] `todo.md` をプロジェクト内へ配置（2026-11-17）
- [x] 11/20 のキャッシュパッチが無効な原因を特定（11/21 01:05 に `lib/client.js` 単体が元へ戻る）
- [x] 体感改善が出なかった構造的理由を検証し、ADR を訂正（2026-11-22）

## メモ

- グローバルTODO: `~/.config/opencode/todo.md`（複数プロジェクト横断のタスク用）。
- 11/20 のパッチは再適用しない（効果 < 副作用リスク）。記録は `work/dsh-session-cache/` に残す。
- 検証記録: `passkey-gateway/docs/session-cache-verification-2026-11-22.md`
- 現行方針: `passkey-gateway/docs/session-local-cache-adr-2026-11-22.md`
