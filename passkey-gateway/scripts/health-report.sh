#!/usr/bin/env bash
# 日常点検レポート。読み取りのみ。結果を docs/health.log に追記する。
set -uo pipefail
root="/home/koppe/document/deepseek-harness/default-workspace/passkey-gateway"
log="$root/docs/health.log"
H="onoderakeita-systemproductname.tailb706b0.ts.net"

warn=0; fail=0
line()  { printf '  %-42s %s\n' "$1" "$2"; }
ok()    { line "$1" "OK ($2)"; }
wrn()   { line "$1" "WARN ($2)"; warn=$((warn+1)); }
ng()    { line "$1" "FAIL ($2)"; fail=$((fail+1)); }
code()  { curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 4 "$1" 2>/dev/null || echo 000; }
codeh() { curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 4 -H "Host: $2" "$1" 2>/dev/null || echo 000; }

report="$(mktemp)"
{
	printf '\n===== %s =====\n' "$(date -Is)"
	# ゲート
	for p in 14180 14181 14182; do
		c=$(code "http://127.0.0.1:$p/ping"); [ "$c" = 200 ] && ok "gate ping :$p" "$c" || ng "gate ping :$p" "$c"
	done
	# 入口
	for pair in "https://$H/|302" "https://$H:8445/|302" "https://$H:8443/.well-known/openid-configuration|200"; do
		u="${pair%|*}"; want="${pair#*|}"; c=$(code "$u")
		[ "$c" = "$want" ] && ok "entry $(printf '%s' "$u" | sed "s|https://$H||")" "$c" || ng "entry $u" "$c"
	done
	c=$(codeh "http://127.0.0.1:14443/setup" "$H"); [ "$c" = 404 ] && ok "setup blocked" "$c" || wrn "setup status" "$c"
	# 旧 /agent は :8445 へ 308 リダイレクト（ブックマーク互換）
	lc=$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 4 -H "Host: $H" "http://127.0.0.1:18890/agent/")
	[ "$lc" = 308 ] && ok "legacy /agent redirect" "$lc" || wrn "legacy /agent redirect" "$lc"
	# ホスト検証
	for pair in "18888 $H" "18889 $H" "18890 $H"; do
		set -- $pair; c=$(codeh "http://127.0.0.1:$1/" "attacker.invalid")
		[ "$c" = 400 ] && ok "host check :$1" "$c" || ng "host check :$1" "$c"
	done
	# opencode 遮断
	if sudo -n /usr/local/sbin/dsh-root-helper check-block 2>/dev/null; then ok "opencode tailnet block" "rule"; else wrn "opencode tailnet block" "missing"; fi
	if ss -lntH '( sport = :49374 )' 2>/dev/null | grep -q '127.0.0.1:49374'; then
		ok "opencode bind" "loopback"
	elif ! ss -lntH '( sport = :49374 )' 2>/dev/null | grep -q ':49374'; then
		ok "opencode bind" "stopped"
	else
		wrn "opencode bind" "not loopback"
	fi
	# Serve
	n=$(tailscale serve status --json 2>/dev/null | python3 -c 'import json,sys;print(len(json.load(sys.stdin).get("Web",{})))' 2>/dev/null || echo 0)
	[ "$n" = 3 ] && ok "serve mappings" "$n" || wrn "serve mappings" "$n"
	# 証明書
	if [ -f "$root/../.dsh/certs/cert.pem" ]; then :; fi
	cert=/home/koppe/.dsh/certs/cert.pem
	if [ -f "$cert" ]; then
		end=$(openssl x509 -in "$cert" -noout -enddate 2>/dev/null | cut -d= -f2)
		days=$(( ( $(date -d "$end" +%s 2>/dev/null || echo 0) - $(date +%s) ) / 86400 ))
		if [ "$days" -gt 30 ]; then ok "tls cert expiry" "${days}d"; else wrn "tls cert expiry" "${days}d"; fi
	else wrn "tls cert expiry" "missing"; fi
	# ディスク/メモリ
	use=$(df --output=pcent / | tail -n1 | tr -dc '0-9')
	[ "$use" -lt 90 ] && ok "root disk used" "${use}%" || wrn "root disk used" "${use}%"
	mem=$(free | awk '/^Mem:/{printf "%d", $3/$2*100}')
	[ "$mem" -lt 90 ] && ok "memory used" "${mem}%" || wrn "memory used" "${mem}%"
	# バックアップ
	last=$(grep -h 'OK:' "$root/docs/backup-offsite.log" 2>/dev/null | tail -n1 | cut -d' ' -f1)
	if [ -n "$last" ]; then
		age=$(( ( $(date +%s) - $(date -d "$last" +%s) ) / 86400 ))
		[ "$age" -le 8 ] && ok "last offsite backup" "${age}d ago" || wrn "last offsite backup" "${age}d ago"
	else wrn "last offsite backup" "none"; fi
	# Timeshift
	if mountpoint -q /mnt/timeshift 2>/dev/null; then
		tu=$(df --output=pcent /mnt/timeshift | tail -n1 | tr -dc '0-9')
		[ "$tu" -lt 90 ] && ok "timeshift disk used" "${tu}%" || wrn "timeshift disk used" "${tu}%"
		latest=$(ls -1d /mnt/timeshift/timeshift/snapshots/*/ 2>/dev/null | sort | tail -n1)
		if [ -n "$latest" ]; then
			hd=$(date -d "@$(stat -c %Y "$latest")" +%Y-%m-%d 2>/dev/null)
			age=$(( ( $(date +%s) - $(stat -c %Y "$latest") ) / 86400 ))
			[ "$age" -le 15 ] && ok "timeshift snapshot" "${hd} (${age}d)" || wrn "timeshift snapshot" "${hd} (${age}d)"
		else wrn "timeshift snapshot" "none"; fi
	else wrn "timeshift mount" "not mounted"; fi

	# 再起動待ち
	[ -f /var/run/reboot-required ] && wrn "reboot required" "pending" || ok "reboot required" "no"
	# 失敗unit
	fu=$(systemctl --failed --no-legend 2>/dev/null | wc -l)
	[ "$fu" -eq 0 ] && ok "failed system units" "$fu" || wrn "failed system units" "$fu"
} >"$report" 2>&1

cat "$report"
{
	printf 'SUMMARY: warn=%d fail=%d\n' "$warn" "$fail"
} >>"$report"
# ローテーション（最大512KB）
if [ -f "$log" ] && [ "$(stat -c %s "$log")" -gt 524288 ]; then tail -n 300 "$log" >"$log.tmp" && mv "$log.tmp" "$log"; fi
cat "$report" >>"$log"
rm -f "$report"

[ "$fail" -eq 0 ] && exit 0 || exit 1
