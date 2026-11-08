#!/usr/bin/env bash
set -uo pipefail
root=/home/koppe/document/deepseek-harness/default-workspace/passkey-gateway
log="$root/docs/start-web-gate.log"
cd "$root/trial" || exit 1
compose() { docker compose -p dsh-passkey-trial --project-directory "$root/trial" -f compose.trial.yaml -f compose.trial.override.yaml "$@"; }
ping_ok() { [ "$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:14182/ping 2>/dev/null)" = 200 ]; }
{
echo "start-web-gate $(date -Is)"
for attempt in 1 2 3; do
  compose up -d oauth2-proxy-web >/dev/null 2>&1
  for _ in $(seq 1 45); do ping_ok && break; sleep 1; done
  if ping_ok; then echo "web gate OK attempt=$attempt"; break; fi
  echo "attempt $attempt failed"
  docker rm -f dsh-passkey-trial-oauth2-proxy-web-1 >/dev/null 2>&1 || true
done
ping_ok || { echo "web gate FINAL FAIL"; exit 1; }
compose up -d --force-recreate caddy >/dev/null 2>&1
for _ in $(seq 1 30); do [ "$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:14445/ 2>/dev/null)" = 302 ] && break; sleep 1; done
echo "agent entry $(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:14445/)"
echo "web entry $(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 3 -H 'Host: onoderakeita-systemproductname.tailb706b0.ts.net' http://127.0.0.1:18890/)"
echo "done $(date -Is)"
} >> "$log" 2>&1
