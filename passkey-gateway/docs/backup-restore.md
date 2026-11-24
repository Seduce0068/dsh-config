# 設定バックアップと復元（パスキーゲート）

## 作成物
- `backup/passkey-config-<日時>.tar.gz`（0600・SHA256付き）
- 含むもの: ゲート/登録/入口の compose・Caddyfile・env（**秘密を含む**）、起動スクリプト、systemd unit、Serve/UFW/待受/コンテナのスナップショット
- 含むもの（自動バックアップ）: DSH の設定・**会話履歴**（`~/.dsh`, agentrouter の sessions/storages/profiles）
- 含まないもの: Cookie、起動トークン、`.dsh-agentrouter/speech-to-text`（再生成可能なモデル）

## 注意
- **秘密を含む**ため共有・チャット貼付・Git管理は禁止。0600 を維持する。
- DB は別途バックアップする（下記）。

## DBバックアップ（Pocket ID）
```bash
docker stop dsh-passkey-register-pocket-id
cp -a <root>/register/data/pocket-id.db <root>/register/data/pocket-id.db.bak-$(date +%Y%m%d-%H%M%S)
docker start dsh-passkey-register-pocket-id
```
※ 稼働中にコピーしない（WAL と不整合になる）。停止中に `-db` / `-wal` / `-shm` をそろえて退避するのが安全。

## 復元（新しい環境/設定破損時）
1. アーカイブを展開し、`config/` を元のパスへ戻す
2. `register/data/` に DB バックアップを戻す（**同じ ENCRYPTION_KEY** が必須）
3. `systemctl --user daemon-reload && systemctl --user restart dsh-passkey-stack.service`
4. Serve/UFW は `state/` の記録と突き合わせて復元（`tailscale serve --bg --https=443 ...` 等）
5. 3入口の疎通（`/` と `:8445` が302、`:8443/setup` が200）を確認

## 未対応（要判断）
- 外付け記憶域（<disk>: <label> <size> NTFS / <disk>: HDD <size> NTFS）への**オフディスク複製**は未実施。
  マウントと書き込みに伴うリスク・対象範囲を決めてから行う。
- Timeshift は `Device: Not Selected`（0件）。NTFS は rsync モードの保存先に適さないため、
  別途 ext4 領域かデータバックアップ方式の選択が必要。

## 自動バックアップ（2026-11-08 追加）

- スクリプト: `scripts/backup-offsite.sh`
- タイマー: `dsh-backup-offsite.timer`（毎週日曜 04:00 前後、Persistent=true、ランダム遅延15分）
- 保存先: 外付け ext4（<label>, <mount>）の `dsh-passkey-backup/auto-<日時>/`（**毎日04:00・最大10世代**）
- 内容: 設定（秘密含む）、DSHホームの設定と会話履歴、Pocket ID の整合DB、状態記録
- 除外: `.dsh-agentrouter/speech-to-text`（231M・再生成可能なモデル）、`node_modules`
- ディスク未接続時は**安全にスキップ**（exit 0、ログに SKIP）
- 書き込み後にハッシュ検証、失敗時はログに FAIL を残す

### 復元ドリル（2026-11-08 実施）
- ディスクを読み取り専用でマウントし、最新 `auto-*` の `sha256sum -c` → **全OK**
- `config.tar.gz` 内にゲート設定・systemd unit・DSHセッションを確認
- バックアップ内 `pocket-id.db` の `integrity_check` → **ok**、ユーザー1・パスキー2

## 復元の実地ドリル（2026-11-08 16:14 実施）

外付けディスクの最新 `auto-*` から実際に復元を試行した（本番には一切触れていない）。

1. 設定アーカイブを展開 → `trial` / `register` / `login-entry` の compose を `docker compose config` で検証 → **すべて OK**
2. 復元DBの `integrity_check` → **ok**（users=1, passkeys=2）
3. 復元した DB と env で **Pocket ID を別ポート(14119)で実起動**
   - **2秒で起動**、discovery 200、issuer 正常、`/setup` 200
   - OIDCクライアント1件・ユーザー1（メール確認済み）・パスキー2件を確認
4. ドリル用コンテナを停止・削除、作業ディレクトリ削除、待受ポート残存なし

→ **設定と本人確認データは、バックアップから実際に起動できることを確認済み。**
（本番ゲートの差し替えまでは行っていない。必要なら停止時間を取って実施する。）

## sudoers方針の同梱（2026-11-08 17:16）

- `root-helper collect-sudoers` で `/etc/sudoers.d/50-dsh-root-helper` と `99-testuser-nopasswd` を
  **ユーザー所有0600**で退避し、`config.tar.gz` 内の `sudoers.d/` に同梱する。
- 復元時は `sudo install -o root -g root -m 0440 sudoers.d/... /etc/sudoers.d/` で配置し、
  `visudo -c` で検証する。
- 検証: 最新および既存の `auto-*` 全5世代で `tar -tzf` の整合性OK、sudoers同梱を確認。

## システムunit・更新ラッパーの同梱（2026-11-08 18:43）

- 追加で同梱: `etc/systemd/system/dsh-passkey-stack.service`、
  `system-all-update-boot.service.d/override.conf`、`usr/local/sbin/system-all-update-wait.sh`。
- `usr/local/sbin/dsh-root-helper`（root:root 0700）は一般ユーザーのtarでは読めないため含まれない。
  復元時は同梱の `scripts/root-helper.sh` を root で install する。
- 検証: 最新アーカイブの `tar -tzf` 整合性OK、上記パスと sudoers 3点を確認。

## 個人リポジトリの同梱（2026-11-08 19:16）

- `repos.tar.gz` を追加。**作業ツリー＋.git**（未コミット・未pushを含む）を保存し、ビルド生成物は除外。
- 対象（11）: `~/jarvis`, `~/.config/opencode`, `~/ドキュメント/作業用/-`,
  `.../Policy_discussion_casualconversation`, `.../rustscript/system_all_update`,
  `.../ZenzaWatch`, `.../userscript/userscript`, `.../UserScripts`, `~/knowledge`,
  `~/.openclaw/workspace`, `~/.codex/memories`
- 世代あたり約**<size>**、生成時間 約23秒。保持10世代で約<size>（空き<size>）。
- 大容量リポジトリ（jarvis/jarvis 19.9G、openIllustration 34G、openrustbooks 32.8G、システム診断 1.9G）は
  GitHub へpush済みのため**同梱せず**（必要なら個別に追加可能）。
