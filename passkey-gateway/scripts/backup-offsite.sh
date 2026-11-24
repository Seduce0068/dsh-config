#!/usr/bin/env bash
# オフディスク・バックアップ（外付け ext4 ディスクへ）。
# - ディスクが無い場合は安全にスキップ（exit 0）
# - 既存データには書き込まず、新しいディレクトリへ追加のみ
# - Pocket ID DB は無停止の整合スナップショット
# - 書き込み後にハッシュ検証、古い世代は最大5件まで保持
set -uo pipefail

root="<home>/document/deepseek-harness/default-workspace/passkey-gateway"
log="$root/docs/backup-offsite.log"
mnt="/mnt/timeshift"
uuid="4011f2a9-a538-4b6e-ac04-7a0fa58a6559"   # sdb1 ext4 TS-BACKUP
keep=14

log_line() { printf '%s %s\n' "$(date -Is)" "$*" >>"$log"; }
cleanup() { sudo -n /usr/local/sbin/dsh-root-helper umount-disk >/dev/null 2>&1 || true; rmdir "$mnt" 2>/dev/null || true; }
trap cleanup EXIT

# 対象ディスクが存在するか（USB未接続なら静かにスキップ）
if [ ! -e "/dev/disk/by-uuid/$uuid" ]; then
	log_line "SKIP: backup disk not present"
	exit 0
fi

mkdir -p "$root/backup"
stage="$(mktemp -d "$root/backup/.stage.XXXXXX")"
trap 'rm -rf "$stage"; cleanup' EXIT
chmod 700 "$stage"
ts="$(date +%Y%m%d-%H%M%S)"
name="auto-$ts"

# 1. Pocket ID DB の整合スナップショット（無停止）
python3 - "$root/register/data/pocket-id.db" "$stage/pocket-id.db" <<'PY'
import sqlite3, sys
src = sqlite3.connect(f"file:{sys.argv[1]}?mode=ro", uri=True)
dst = sqlite3.connect(sys.argv[2])
with dst:
    src.backup(dst)
dst.close(); src.close()
PY
if ! python3 - "$stage/pocket-id.db" <<'PY'
import sqlite3, sys
con = sqlite3.connect(sys.argv[1])
ok = con.execute("pragma integrity_check").fetchone()[0]
con.close()
sys.exit(0 if ok == "ok" else 1)
PY
then
	log_line "FAIL: db integrity"
	exit 1
fi

# 1b. sudoers方針を先に退避（tarに含めるため）

# 1c. 個人リポジトリ（未コミット作業を含む。ビルド生成物は除外）
tar -C / -czf "$stage/repos.tar.gz" \
	--warning=no-file-changed \
	--exclude='*/node_modules' --exclude='*/target' --exclude='*/dist' \
	--exclude='*/.cache' --exclude='*/.next' --exclude='*/__pycache__' \
	--exclude='*/venv' --exclude='*/.venv' --exclude='*/.serena/cache' \
	--exclude='home/koppe/.config/opencode/opencode.jsonc*' \
	--exclude='home/koppe/.config/opencode/dsh.env' \
	--exclude='home/koppe/.config/opencode/deepai.key' \
	--exclude='*/browser-session' --exclude='*/browser-session/*' \
	--exclude='*.env*' \
	--exclude='*.key' --exclude='*.pem' --exclude='*.p12' \
	--exclude='id_rsa*' --exclude='*credentials*' \
	"home/koppe/.config/opencode" \
	"home/koppe/ドキュメント/作業用/-" \
	"home/koppe/ドキュメント/作業用/Policy_discussion_casualconversation" \
	"home/koppe/ドキュメント/作業用/rustscript/system_all_update" \
	"home/koppe/ドキュメント/作業用/ZenzaWatch" \
	"home/koppe/ドキュメント/作業用/userscript/userscript" \
	"home/koppe/ドキュメント/作業用/UserScripts" \
	"home/koppe/knowledge" \
	"home/koppe/.agents/skills" \
	"home/koppe/.openclaw/workspace" \
	"home/koppe/.codex/memories" \
	2>/dev/null || true
sudo -n /usr/local/sbin/dsh-root-helper collect-sudoers "$stage" || true

# 2. 設定とDSHデータのアーカイブ
tar -C / -czf "$stage/config.tar.gz" \
	--warning=no-file-changed \
	--exclude='home/koppe/.dsh/.credentials.yaml' \
	--exclude='home/koppe/.dsh/certs' \
	--exclude='*/.dsh/certs/*' \
	--exclude='*.env*' --exclude='*.key' --exclude='*.pem' --exclude='*.p12' \
	--exclude='*credentials*' \
	--exclude='*pocket-id.db-*' --exclude='*pocket-id.db.bak-*' \
	$(cd / && ls -d \
		"home/koppe/.config/systemd/user/dsh-passkey-stack.service" \
		"home/koppe/.config/systemd/user/dsh-web.service" \
		"home/koppe/.config/systemd/user/dsh-web-agentrouter.service" \
		"home/koppe/.config/systemd/user/dsh-backup-offsite.service" \
		"home/koppe/.config/systemd/user/dsh-backup-offsite.timer" \
		"home/koppe/.config/systemd/user/dsh-passkey-watchdog.service" \
		"home/koppe/.config/systemd/user/dsh-passkey-watchdog.timer" \
		"home/koppe/.config/systemd/user/dsh-health-report.service" \
		"home/koppe/.config/systemd/user/dsh-health-report.timer" \
		"home/koppe/.config/systemd/user/dsh-github-inventory.service" \
		"home/koppe/.config/systemd/user/dsh-github-inventory.timer" \
		"home/koppe/.config/systemd/user/dsh-backup-verify.service" \
		"home/koppe/.config/systemd/user/dsh-backup-verify.timer" \
		"home/koppe/.config/systemd/user/dsh-security-scan.service" \
		"home/koppe/.config/systemd/user/dsh-security-scan.timer" \
		"home/koppe/.config/systemd/user/dsh-advisory-check.service" \
		"home/koppe/.config/systemd/user/dsh-advisory-check.timer" \
		"etc/systemd/system/block-tailnet-opencode.service" \
		"usr/local/sbin/block-tailnet-opencode.sh" \
		"etc/systemd/system/dsh-passkey-stack.service" \
		"etc/systemd/system/system-all-update-boot.service.d/override.conf" \
		"usr/local/sbin/system-all-update-wait.sh" \
		"usr/local/sbin/dsh-root-helper" \
		"home/koppe/document/deepseek-harness/default-workspace/passkey-gateway/trial" \
		"home/koppe/document/deepseek-harness/default-workspace/passkey-gateway/register" \
		"home/koppe/document/deepseek-harness/default-workspace/passkey-gateway/login-entry" \
		"home/koppe/document/deepseek-harness/default-workspace/passkey-gateway/scripts" \
		"home/koppe/document/deepseek-harness/default-workspace/AGENTS.md" \
		"home/koppe/document/deepseek-harness/default-workspace/passkey-gateway/docs" \
		"home/koppe/.dsh" \
		"home/koppe/.dsh-agentrouter/sessions" \
		"home/koppe/.dsh-agentrouter/storages" \
		"home/koppe/.dsh-agentrouter/profiles" \
		"home/koppe/.dsh-agentrouter/dsh-mobile-maxxing" 2>/dev/null) \
	--exclude='*/node_modules' \
	-C "$stage" sudoers.d \
	2>/dev/null || true

# 3. 状態記録
{
	tailscale serve status 2>&1 || true
	echo '--- ufw ---'
	sudo -n /usr/local/sbin/dsh-root-helper ufw-status 2>&1 || true
	echo '--- listeners ---'
	ss -lntp 2>&1 || true
	echo '--- containers ---'
	docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}' 2>&1 || true
} >"$stage/state.txt" 2>&1

cat >"$stage/README-RESTORE.txt" <<'EOF'
DSH 自動バックアップ（秘密・会話履歴を含む）
- config.tar.gz : ゲート設定（env含む）、systemd unit、DSHホーム（~/.dsh, agentrouterのsessions/storages/profiles）
- pocket-id.db  : Pocket ID の整合スナップショット（ENCRYPTION_KEY 必須）
- repos.tar.gz  : 個人リポジトリ＋指示/秘密設定（dsh.env, .env等を含む。要物理保護）
- state.txt     : Serve / UFW / 待受 / コンテナの記録
復元: 展開 → DB配置（同キー） → systemctl --user daemon-reload → restart dsh-passkey-stack
注意: 共有・アップロード禁止。ディスクを物理的に保護すること。
EOF

( cd "$stage" && sha256sum config.tar.gz repos.tar.gz pocket-id.db state.txt README-RESTORE.txt >SHA256SUMS )
chmod -R go-rwx "$stage"

# 4-5. 書き込みと検証（root-helper に固定操作を委譲）
if ! sudo -n /usr/local/sbin/dsh-root-helper publish-backup "$stage" "$name"; then
	log_line "FAIL: publish-backup $name"
	exit 1
fi
log_line "OK: $name ($(du -sh "$stage" | cut -f1)) verified"

# 6. 世代管理は root-helper の publish-backup 内で実施
