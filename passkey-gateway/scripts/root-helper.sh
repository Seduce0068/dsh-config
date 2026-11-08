#!/usr/bin/env bash
# root-helper: ゲート運用に必要な固定操作だけを提供する。
# sudoers では本スクリプト1本のみ許可する想定（引数は検証する）。
set -euo pipefail
UUID="4011f2a9-a538-4b6e-ac04-7a0fa58a6559"   # sdb1 ext4 (TS-BACKUP)
MNT="/mnt/timeshift"
DEV="/dev/disk/by-uuid/$UUID"
BKROOT="dsh-passkey-backup"
KEEP=10

die() { echo "dsh-root-helper: $*" >&2; exit 1; }

MOUNTED_BY_US=0
ensure_mounted_rw() {
	[ -e "$DEV" ] || die "device not present"
	mkdir -p "$MNT"
	if ! mountpoint -q "$MNT"; then
		mount "$DEV" "$MNT"; MOUNTED_BY_US=1
	fi
}
ensure_mounted_ro() {
	[ -e "$DEV" ] || die "device not present"
	mkdir -p "$MNT"
	if ! mountpoint -q "$MNT"; then
		mount -o ro,nosuid,nodev,noexec "$DEV" "$MNT"; MOUNTED_BY_US=1
	fi
}
umount_if_mounted() { [ "$MOUNTED_BY_US" = 1 ] && mountpoint -q "$MNT" && umount "$MNT" || true; }

case "${1:-}" in
mount-disk) ensure_mounted_rw ;;
umount-disk) umount_if_mounted ;;
block-tailnet)
	iptables -C INPUT -i tailscale0 -p tcp --dport 49374 -j DROP 2>/dev/null || \
		iptables -I INPUT 1 -i tailscale0 -p tcp --dport 49374 -j DROP
	ip6tables -C INPUT -i tailscale0 -p tcp --dport 49374 -j DROP 2>/dev/null || \
		ip6tables -I INPUT 1 -i tailscale0 -p tcp --dport 49374 -j DROP
	;;
publish-backup)
	# 使い方: publish-backup <stage-dir> <name>
	src="${2:?stage-dir required}"
	name="${3:?name required}"
	[[ "$name" =~ ^[A-Za-z0-9._-]+$ ]] || die "invalid name"
	[ -d "$src" ] || die "stage dir missing"
	ensure_mounted_rw
	trap umount_if_mounted EXIT
	dest="$MNT/$BKROOT/$name"
	mkdir -p "$dest"
	cp -a "$src"/. "$dest"/
	sync
	( cd "$dest" && sha256sum -c SHA256SUMS >/dev/null ) || die "hash mismatch"
	# 世代管理（auto-* のみ）
	ls -1dt "$MNT/$BKROOT"/auto-* 2>/dev/null | tail -n +$((KEEP+1)) | xargs -r rm -rf
	;;
collect-sudoers)
	# 使い方: collect-sudoers <dest-dir>   sudoers方針を復旧用に退避
	dest="${2:?dest required}"
	[ -d "$dest" ] || die "dest dir missing"
	mkdir -p "$dest/sudoers.d"
	chown koppe:koppe "$dest/sudoers.d"
	for f in 50-dsh-root-helper 51-system-update 99-koppe-nopasswd 99-koppe-nopasswd.disabled; do
		[ -f "/etc/sudoers.d/$f" ] || continue
		install -o koppe -g koppe -m 0600 "/etc/sudoers.d/$f" "$dest/sudoers.d/$f"
	done
	;;
restart-stack)
	systemctl restart dsh-passkey-stack.service
	;;
check-block)
	iptables -C INPUT -i tailscale0 -p tcp --dport 49374 -j DROP 2>/dev/null
	;;
ufw-status)
	ufw status numbered
	;;
verify-backup)
	dir="${2:?dir required}"
	ensure_mounted_ro
	trap umount_if_mounted EXIT
	( cd "$MNT/$dir" && sha256sum -c SHA256SUMS )
	;;
*) die "usage: $0 <mount-disk|umount-disk|block-tailnet|publish-backup DIR NAME|verify-backup DIR>" ;;
esac
