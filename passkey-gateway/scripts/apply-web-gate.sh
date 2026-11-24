#!/usr/bin/env bash
# web(443)ゲートを起動し、失敗時は自動で戻す。GUI(8445)には影響しない。
set -uo pipefail
root=<home>/document/deepseek-harness/default-workspace/passkey-gateway
log="$root/docs/apply-web-gate.log"
cd "$root/trial" || exit 1
cbak="$(ls -1t compose.trial.yaml.webpre-* | head -n 1)"
fbak="$(ls -1t caddy/Caddyfile.staging.webpre-* | head -n 1)"
compose() { docker compose -p dsh-passkey-trial --project-directory "$root/trial" -f compose.trial.yaml -f compose.trial.override.yaml "$@"; }
wait_code() { local url=$1 want=$2 i; for i in $(seq 1 40); do [ "$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 2 "$url" 2>/dev/null)" = "$want" ] && return 0; sleep 1; done; return 1; }
{
echo "apply-web-gate start $(date -Is)"
compose up -d oauth2-proxy-web >/dev/null 2>&1
if ! wait_code http://127.0.0.1:14182/ping 200; then
  echo "FAIL web gate ping; rolling back files"; cp -a "$cbak" compose.trial.yaml; cp -a "$fbak" caddy/Caddyfile.staging
  compose up -d --force-recreate caddy >/dev/null 2>&1; exit 1
fi
echo "web gate ping OK"
compose up -d --force-recreate caddy >/dev/null 2>&1
if ! wait_code http://127.0.0.1:14445/ 302; then
  echo "FAIL agent entry; restoring caddy"; cp -a "$fbak" caddy/Caddyfile.staging; compose up -d --force-recreate caddy >/dev/null 2>&1; exit 1
fi
echo "agent entry OK"
if wait_code http://127.0.0.1:18890/ 302; then echo "web entry 302 OK"; else echo "WARN web entry unexpected"; fi
echo "apply-web-gate done $(date -Is)"
} >> "$log" 2>&1
