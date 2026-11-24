# dockerグループ権限の分離（準備完了・rootコマンド1回で適用）

## 実測したリスク
- `testuser` は `docker` グループ所属。`docker run ... id` は **uid=0(root)**。
- つまり sudo を絞っても、`docker` 経由で host root 相当に到達できる（残余リスク）。

## 構造
- ユーザー側で docker を必要とするのは **ゲート一式（dsh-passkey-stack.service）のみ**
  （`~/.config/systemd/user/` を調査）。
- 他コンテナ（homeassistant, adguardhome）は root 側で管理。

## 移行内容（スクリプト化済み）
`scripts/migrate-to-system-service.sh`（rootで実行）:
1. `dsh-root-helper` を更新（`restart-stack` 追加）
2. `/etc/systemd/system/dsh-passkey-stack.service` 作成・enable（rootでゲートを起動）
3. user unit を停止・無効化
4. システムunitで起動し、3ゲートのpingと入口を検証（失敗時は user unit へ自動ロールバック）
5. `--remove-docker-group` 指定時、`gpasswd -d testuser docker`
6. watchdog は helper 経由でシステムunitを再起動（未移行時は user unit にフォールバック）

## 実行コマンド（root必要）
```bash
sudo bash <home>/document/deepseek-harness/default-workspace/passkey-gateway/scripts/migrate-to-system-service.sh --remove-docker-group
```
- 実行中にゲートが**数秒停止**します（自動復旧・失敗時ロールバックあり）。
- dockerグループから外れた後は、手動の `docker` 操作に sudo パスワードが必要。
- 既存シェルは再ログインするまでグループが残る場合あり。

## 未実施の理由
sudo縮小（A案）適用済みのため、エージェントからは root 操作ができない。
上記1コマンドのみユーザー実行が必要。
