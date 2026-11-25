---
type: Reference
title: エージェントプリセット自動選択プラグイン設計
description: R1 の確定事実を反映した DSH 向け設計書
generated:
  by: lead/dsh
  at: '2026-11-25T23:46:55+09:00'
status: draft
tags:
  - dsh
  - agent-preset
  - plugin
  - design
---

## 目的と用語

本設計は、DeepSeek Harness（DSH）のセッション開始時に
エージェントプリセットを自動選択するプラグインを定める。
R1 の確定事実を前提とし、実装可能な粒度で仕様を固定する。
生成時刻はターン開始時のサンプル値を用いた[^time]。

| 用語 | 定義 |
| --- | --- |
| preset | DSH のエージェント動作設定。standard / ptc / creator 等。 |
| blank session | turn が 0 かつ openTurnStartSeq が null の未開始セッション。 |
| 明示指定 | UI stage / selectedDefault / 再開セッションの preset。 |
| 自動選択 | ルールと閾値で preset を決める本プラグインの処理。 |
| deployment default | デプロイ側の既定 preset（通常 standard）。 |
| 否定ゲート | 自動選択を禁じる条件群。 |
| 候補 | 自動選択の対象。standard / ptc / creator の 3 種。 |

## 構成

| 層 | 役割 | 実体 |
| --- | --- | --- |
| Host plugin | イベント購読・判定・select 実行 | host モジュール |
| Config | 有効化・既定値・ルール・閾値・LLM 設定 | バンドル設定 |
| optional Client UI | 選択結果の表示と手動上書きの案内（任意） | client inject |

Host plugin が `agentPresets.select(session.id, preset)` を
呼ぶ唯一の主体となる。`session/message` は存在しないため、
購読対象は `session/event` と `user/message`（commit 後の emit）に限る。

イベント購読（`ctx.on('session/event', ...)`）には Host エントリ
`index.js` が必須である。configuration-only バンドルでは実現できない。
本設計は Host-only 構成を採る。

最小構成を表に示す。

| ファイル | 必須内容 |
| --- | --- |
| package.json | name / version / private / type / exports / patch |
| cordis.patch.yml | `- insert:` / id / `name: @local/...` / config |
| index.js | `apply(ctx, config)` / `export const inject` |

package.json には `type: module`、`exports: {'.': './index.js'}`、
`dsh.bundle.patch` を設定する。
cordis.patch.yml は `- insert:` の下に `id` / `name: @local/...` /
`config` を置く。locale と icon もメタデータとして用意する。

必須サービスは `export const inject = [...]` で宣言する。
任意サービスは `ctx.get('name')?.method()` で取得する。
購読とタイマーは `apply` 内の `ctx` へ登録し、寿命を委ねる。

既存バンドルには 2 つのパターンがある。
dsh-resilient-retry は config 全体を再記述し、
dsh-goal-bulk-resume は最小 insert と client inject を組み合わせる。
本設計は後者の最小 insert を採用する。client inject は任意とし、
Host-only の event 購読を主軸に置く。

## 選択アルゴリズム

### スコアリング

候補は standard / ptc / creator の 3 種に限定する。
minimal は比較実験専用のため候補外とする。
broken preset（読み込み失敗・設定不正）も候補外とする。

スコアは 0 から 100 の整数とする。standard に 10 点を初期付与し、
他候補は 0 点から開始する。ルール命中で加点し、否定条件で減点する。

### PTC の陽性シグナル

PTC は次の 3 群をすべて満たす場合のみ候補となる。

| 群 | 判定例 |
| --- | --- |
| 一括対象 | 複数ファイル・複数項目を対象とする語 |
| 集約動詞 | まとめる / 一括 / 横断 / 一掃 等 |
| 構造化出力 | JSON / CSV / 表 / レポート形式の指定 |

1 群でも欠ければ PTC を候補外にする。
Coding Tools 設定が無効なら PTC と minimal は standard へ
フォールバックする。

### Creator の陽性シグナル

Creator の対象は「DSH 自体への機能追加」である。
通常アプリのコード修正は standard に分類する。
リポジトリパスと要求文の両方を見て判定する。

### 否定ゲート

次に該当するときは自動選択せず、deployment default を維持する。

- workflow の作成・変更・実行管理を伴う要求
- plugin のインストール・有効化・無効化を伴う要求
- DSH カスタマイズ（コア設定・バンドル編集）を伴う要求
- 明示指定が既に存在する場合

### 閾値とフォールバック

| 項目 | 値 | 意味 |
| --- | --- | --- |
| scoreThreshold | 60 | 最高点が未満なら standard |
| margin | 10 | 1 位と 2 位の差が未満なら standard |
| lowConfidence | 60 | 未満で LLM fallback を検討 |
| maxCandidates | 3 | 評価候補数の上限 |

LLM fallback は任意機能で既定は無効とする。
ルール主軸の確信度が lowConfidence 未満のときだけ呼び出す。
利用できない場合は standard を返す。

## ライフサイクル

判定はセッション生成直後の 1 回だけ行う。
購読は `apply` 内で `ctx.on('session/event', ...)` として登録する。

1. `session/event` で blank session を検知する。
2. 明示指定を確認し、あれば select を呼ばない。
3. `user/message`（commit 後の emit）で要求文を得る。
4. 否定ゲートを適用して候補を絞る。
5. スコアリングと閾値で preset を決める。
6. `agentPresets.select(session.id, preset)` を呼ぶ。

select が成功するのは blank session（turn 0 かつ
openTurnStartSeq が null）だけである。開始済みには
`agent-preset/locked` が返る。このエラーは無視し再試行しない。
再開セッションの preset は明示指定として扱う。

差し替えは `agent-preset/selected` ログへ記録される。
replay で再現され `tools/change` が発火するため、
select ごとにスコアとルール ID を併記する。

## Config schema

スキーマは `@deepseek-ai/schemastery` の `z.object` で定義する。
検証済み config は `apply` の第 2 引数として渡る。
設定項目を表に示す。

| キー | 型 | 既定値 | 説明 |
| --- | --- | --- | --- |
| enabled | boolean | true | プラグイン全体の有効化 |
| defaultPreset | string | standard | フォールバック先 |
| candidates | array | 3 種 | 自動候補の列挙 |
| rules | array | [] | ルール ID と重み |
| thresholds.score | number | 60 | 採用スコア閾値 |
| thresholds.margin | number | 10 | 1 位と 2 位の差 |
| thresholds.lowConfidence | number | 60 | LLM 検討閾値 |
| llmFallback.enabled | boolean | false | LLM 補助の有効化 |
| llmFallback.provider | string | unset | 使用プロバイダ |
| brokenPresetPolicy | string | exclude | broken の扱い |
| respectExplicit | boolean | true | 明示指定を保護 |

rules の各行は id / group / weight / patterns を持つ。
group は ptc-positive / creator-positive / negative-gate のいずれか。

## 安全性

- 明示指定は上書きしない。優先順位は
  ユーザー選択 > 自動選択 > deployment default とする。
- broken preset を候補外にし、選択ログへ理由を残す。
- `agent-preset/locked` は無視する。開始済みセッションに触れない。
- 全選択を `agent-preset/selected` へ記録し replay 可能にする。
- `tools/change` の発火を前提に設定差分を最小化する。

## 検証方法

1. Host エントリ `index.js` の読み込みと event 購読登録を確認する。
2. dump-config で enabled / defaultPreset / rules の反映を確認する。
3. バンドルを入れ替え、HMR で client inject の更新を確認する。
   HMR は client のみを反映するため host は再起動が必要な場合がある。
4. 実セッションで blank session を作り選択ログを確認する。
5. `agent-preset/selected` の理由と replay 再現を確認する。
6. 開始済みセッションで `agent-preset/locked` を確認する。
7. 明示指定のあるセッションで上書きが起きないことを確認する。

## 未解決点

1. LLM fallback のコスト。呼び出し回数とトークン上限の見積もりが未定。
   既定は無効とし、計測後に閾値を設定する。
2. GUI 表示の反映タイミング。`tools/change` は発火するが、
   UI が `agent-preset/selected` を読む時期は未確認である。
   HMR を組み合わせた実機確認を残す。

[^time]: shell 実行が許可されていないため、date の代わりに
    ターン開始時のサンプル値を採用した。
