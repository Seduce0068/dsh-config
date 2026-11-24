#!/usr/bin/env bash
set -uo pipefail
root=<home>/document/deepseek-harness/default-workspace/passkey-gateway
log="$root/docs/bind-loopback.log"
cd "$root/trial" || exit 1
backup="$(ls -1t caddy/Caddyfile.staging.prebind-* | head -n 1)"
recreate() { docker compose -p dsh-passkey-trial --project-directory "$root/trial" -f compose.trial.yaml -f compose.trial.override.yaml up -d --force-recreate caddy >/dev/null 2>&1; }
wait_entry() { local i; for i in $(seq 1 30); do [ "$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:14445/ 2>/dev/null)" = 302 ] && return 0; sleep 1; done; return 1; }
{
echo "bind-loopback2 start $(date -Is)"
python3 - <<'PY'
from pathlib import Path
p = Path('caddy/Caddyfile.staging')
s = p.read_text()
if 'bind 127.0.0.1' not in s:
    s = s.replace(':18888 {\n', ':18888 {\n\tbind 127.0.0.1\n')
    s = s.replace(':18889 {\n', ':18889 {\n\tbind 127.0.0.1\n')
p.write_text(s)
print('bind directives inserted')
PY
if ! docker run --rm --network none -v "$root/trial/caddy:/etc/caddy:ro" \
  -e DSH_WEB_UPSTREAM=http://127.0.0.1:3080 -e DSH_AGENT_UPSTREAM=http://127.0.0.1:3081 \
  docker.io/library/caddy:2.11.9@sha256:0c2243efcf437ab7f7a978f1027fcf0d4f9be8a75df27b1b3fbc5dbe0ffa8cf0 \
  caddy validate --config /etc/caddy/Caddyfile.staging --adapter caddyfile >/dev/null 2>&1; then
  echo "FAIL validate; restoring"; cp -a "$backup" caddy/Caddyfile.staging; exit 1
fi
echo "validate OK"
recreate
if ! wait_entry; then
  echo "FAIL entry; restoring"; cp -a "$backup" caddy/Caddyfile.staging; recreate; wait_entry && echo "rolled back and entry OK"; exit 1
fi
echo "entry OK"
ss -lntH | awk '$4 ~ /:(18888|18889)$/ {print "  listener "$4}' >> "$log"
echo "bind-loopback2 done $(date -Is)"
} >> "$log" 2>&1
