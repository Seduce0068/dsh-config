#!/usr/bin/env bash
# 起動直後のapt/dpkgロック競合を避けてから system-all-update を実行する。
# systemd の system-all-update-boot.service の ExecStart をこれに差し替える。
set -uo pipefail
for _ in $(seq 1 120); do
	if ! fuser /var/lib/apt/lists/lock /var/lib/dpkg/lock-frontend >/dev/null 2>&1; then
		exec /home/koppe/.local/bin/system-all-update "$@"
	fi
	sleep 5
done
echo "apt/dpkg lock not released; skipping boot update" >&2
exit 0
