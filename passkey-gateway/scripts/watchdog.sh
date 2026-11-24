#!/usr/bin/env bash
# ゲートの死活監視。異常時のみ systemd unit で復旧する。正常時は何もしない。
set -uo pipefail
root="<home>/document/deepseek-harness/default-workspace/passkey-gateway"
log="$root/docs/watchdog.log"

log_line() {
	# ログが大きくなりすぎたら古い内容を捨てる（最大512KB）
	if [ -f "$log" ] && [ "$(stat -c %s "$log" 2>/dev/null || echo 0)" -gt 524288 ]; then
		tail -n 200 "$log" >"$log.tmp" 2>/dev/null && mv "$log.tmp" "$log"
	fi
	printf '%s %s\n' "$(date -Is)" "$*" >>"$log"
}

code() { curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 3 "$1" 2>/dev/null || echo 000; }
# Host検査を通過する必要がある入口向け（Hostを明示）
code_host() { curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 3 -H "Host: $2" "$1" 2>/dev/null || echo 000; }
PUBLIC_HOST="onoderakeita-systemproductname.<tailnet>"

healthy() {
	[ "$(code http://127.0.0.1:14180/ping)" = 200 ] &&
	[ "$(code http://127.0.0.1:14181/ping)" = 200 ] &&
	[ "$(code http://127.0.0.1:14182/ping)" = 200 ] &&
	[ "$(code http://127.0.0.1:14111/.well-known/openid-configuration)" = 200 ] &&
	[ "$(code_host http://127.0.0.1:14445/ "$PUBLIC_HOST:8445")" = 302 ] &&
	[ "$(code_host http://127.0.0.1:18890/ "$PUBLIC_HOST")" = 302 ]
}

# Tailscale Serve の公開マッピング（/ と 8443 と 8445）が揃っているか
serve_healthy() {
	local H="onoderakeita-systemproductname.<tailnet>" json
	json="$(tailscale serve status --json 2>/dev/null)" || return 1
	printf '%s' "$json" | python3 -c "
import json,sys
d=json.load(sys.stdin)
web=d.get('Web',{})
need={'$H:443':'http://127.0.0.1:18890','$H:8443':'http://127.0.0.1:14443','$H:8445':'http://127.0.0.1:14445'}
ok=all(web.get(k,{}).get('Handlers',{}).get('/',{}).get('Proxy')==v for k,v in need.items())
sys.exit(0 if ok else 1)
" 2>/dev/null
}

restore_serve() {
	tailscale serve --bg --https=443 http://127.0.0.1:18890 >/dev/null 2>&1
	tailscale serve --bg --https=8443 http://127.0.0.1:14443 >/dev/null 2>&1
	tailscale serve --bg --https=8445 http://127.0.0.1:14445 >/dev/null 2>&1
}

if ! serve_healthy; then
	log_line "SERVE MAPPING missing; restoring"
	restore_serve
	if serve_healthy; then log_line "serve mappings restored"; else log_line "serve restore FAILED"; fi
fi

if healthy && serve_healthy; then
	exit 0
fi

log_line "UNHEALTHY detected: pings=$(code http://127.0.0.1:14180/ping)/$(code http://127.0.0.1:14181/ping)/$(code http://127.0.0.1:14182/ping) idp=$(code http://127.0.0.1:14111/.well-known/openid-configuration) agent=$(code_host http://127.0.0.1:14445/ "$PUBLIC_HOST:8445") web=$(code_host http://127.0.0.1:18890/ "$PUBLIC_HOST")"
export XDG_RUNTIME_DIR=/run/user/1000 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
# システムunit移行後はhelper経由、未移行ならuser unit
if sudo -n /usr/local/sbin/dsh-root-helper restart-stack >/dev/null 2>&1; then
	log_line "recovery: system unit restart (helper)"
elif systemctl --user restart dsh-passkey-stack.service 2>>"$log"; then
	log_line "recovery: user unit restart"
else
	log_line "recovery: unit restart FAILED"
fi
for i in $(seq 1 30); do
	if healthy && serve_healthy; then
		log_line "recovered in ${i}s"
		exit 0
	fi
	sleep 1
done
log_line "recovery FAILED after 30s"
exit 1
