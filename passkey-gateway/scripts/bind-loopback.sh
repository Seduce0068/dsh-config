#!/usr/bin/env bash
# 内部Caddyの待受をループバック限定にし、失敗時は自動で戻す。
set -uo pipefail
root=<home>/document/deepseek-harness/default-workspace/passkey-gateway
log="$root/docs/bind-loopback.log"
cd "$root/trial" || exit 1
backup="$(ls -1t caddy/Caddyfile.staging.bak-* | head -n 1)"
recreate() { docker compose -p dsh-passkey-trial --project-directory "$root/trial" -f compose.trial.yaml -f compose.trial.override.yaml up -d --force-recreate caddy >/dev/null 2>&1; }
{
echo "bind-loopback start $(date -Is)"
python3 - <<'PY'
from pathlib import Path
p = Path('caddy/Caddyfile.staging')
s = p.read_text()
s = s.replace(':18888 {', '127.0.0.1:18888 {')
s = s.replace(':18889 {', '127.0.0.1:18889 {')
p.write_text(s)
print('caddyfile rewritten')
PY
if ! docker run --rm --network none -v "$root/trial/caddy:/etc/caddy:ro" \
  -e DSH_WEB_UPSTREAM=http://127.0.0.1:3080 -e DSH_AGENT_UPSTREAM=http://127.0.0.1:3081 \
  docker.io/library/caddy:2.11.9@sha256:0c2243efcf437ab7f7a978f1027fcf0d4f9be8a75df27b1b3fbc5dbe0ffa8cf0 \
  caddy validate --config /etc/caddy/Caddyfile.staging --adapter caddyfile >/dev/null 2>&1; then
  echo "FAIL validate; restoring"; cp -a "$backup" caddy/Caddyfile.staging; exit 1
fi
recreate
ok=0
for _ in $(seq 1 30); do
  code=$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:14445/ 2>/dev/null)
  [ "$code" = 302 ] && ok=1 && break
  sleep 1
done
if [ "$ok" -ne 1 ]; then
  echo "FAIL entry after recreate; restoring"; cp -a "$backup" caddy/Caddyfile.staging; recreate; exit 1
fi
echo "entry OK; listeners:"; ss -lntH | awk '$4 ~ /:(18888|18889)$/ {print "  "$4}'
echo "bind-loopback done $(date -Is)"
} >> "$log" 2>&1
