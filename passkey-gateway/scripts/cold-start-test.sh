#!/usr/bin/env bash
# ゲート一式を完全停止 → systemd unit で復旧できるか検証。
# 失敗時は compose で直接フォールバック起動する。
set -uo pipefail
root=/home/koppe/document/deepseek-harness/default-workspace/passkey-gateway
log="$root/docs/cold-start-test.log"
export XDG_RUNTIME_DIR=/run/user/1000 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
compose_all() {
  docker compose -p dsh-passkey-register --project-directory "$root/register" -f "$root/register/compose.register.yaml" "$@"
  docker compose -p dsh-passkey-login --project-directory "$root/login-entry" -f "$root/login-entry/compose.login.yaml" "$@"
  docker compose -p dsh-passkey-trial --project-directory "$root/trial" -f "$root/trial/compose.trial.yaml" -f "$root/trial/compose.trial.override.yaml" "$@"
}
host_code() { curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 3 -H "Host: $2" "$1" 2>/dev/null || echo 000; }
healthy() {
  [ "$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:14180/ping 2>/dev/null)" = 200 ] &&
  [ "$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:14181/ping 2>/dev/null)" = 200 ] &&
  [ "$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:14182/ping 2>/dev/null)" = 200 ] &&
  [ "$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:14111/.well-known/openid-configuration 2>/dev/null)" = 200 ] &&
  [ "$(host_code http://127.0.0.1:14445/ onoderakeita-systemproductname.tailb706b0.ts.net:8445)" = 302 ] &&
  [ "$(host_code http://127.0.0.1:18890/ onoderakeita-systemproductname.tailb706b0.ts.net)" = 302 ]
}
{
echo "cold-start-test start $(date -Is)"
echo "--- stop all gate projects ---"
compose_all stop >/dev/null 2>&1
sleep 2
if healthy; then echo "UNEXPECTED: still healthy after stop"; fi
echo "--- start via systemd unit ---"
systemctl --user restart dsh-passkey-stack.service
ok=0
for i in $(seq 1 60); do
  if healthy; then ok=1; echo "unit recovered in ${i}s"; break; fi
  sleep 1
done
if [ "$ok" -eq 0 ]; then
  echo "UNIT FAILED; fallback compose up"
  compose_all up -d >/dev/null 2>&1
  for i in $(seq 1 60); do
    if healthy; then ok=2; echo "fallback recovered in ${i}s"; break; fi
    sleep 1
  done
fi
echo "result=$ok (1=unit,2=fallback,0=failed)"
echo "final: $(healthy && echo HEALTHY || echo UNHEALTHY)"
echo "cold-start-test done $(date -Is)"
} >> "$log" 2>&1
