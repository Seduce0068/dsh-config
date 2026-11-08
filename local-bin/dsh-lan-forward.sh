#!/usr/bin/env bash
set -euo pipefail

iface="enp4s0"
ip="$(ip -4 -o addr show dev "${iface}" scope global 2>/dev/null | awk '{print $4}' | cut -d/ -f1 | head -1)"

if [[ -z "${ip}" ]]; then
	echo "dsh-lan-forward: no global IPv4 address on ${iface}" >&2
	exit 1
fi

exec /usr/bin/socat "TCP4-LISTEN:3080,bind=${ip},fork,reuseaddr" TCP4:127.0.0.1:3080
