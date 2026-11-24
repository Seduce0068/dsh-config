#!/usr/bin/env bash
# issuer検証を厳格化し、失敗時は自動で元に戻す。GUI(:8445)の短時間断を伴う。
set -uo pipefail
root=<home>/document/deepseek-harness/default-workspace/passkey-gateway
log="$root/docs/strict-issuer-apply.log"
cd "$root/trial" || exit 1
backup="$(ls -1t compose.trial.yaml.bak-* | head -n 1)"
up() { docker compose -p dsh-passkey-trial --project-directory "$root/trial" -f compose.trial.yaml -f compose.trial.override.yaml up -d --force-recreate "$@" >/dev/null 2>&1; }
wait_ping() { local port=$1; for _ in $(seq 1 40); do [ "$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 2 "http://127.0.0.1:$port/ping" 2>/dev/null)" = 200 ] && return 0; sleep 1; done; return 1; }
{
echo "apply-strict-issuer start $(date -Is)"
# 1) 設定変更（issuer/ JWKS を公開HTTPSへ、検証スキップを削除）
python3 - <<'PY'
from pathlib import Path
p = Path('compose.trial.yaml')
s = p.read_text()
s = s.replace('      - --oidc-issuer-url=http://127.0.0.1:14111\n', '      - --oidc-issuer-url=https://onoderakeita-systemproductname.<tailnet>:8443\n')
s = s.replace('      - --insecure-oidc-skip-issuer-verification=true\n', '')
s = s.replace('      - --oidc-jwks-url=http://127.0.0.1:14111/.well-known/jwks.json\n', '      - --oidc-jwks-url=https://onoderakeita-systemproductname.<tailnet>:8443/.well-known/jwks.json\n')
p.write_text(s)
print('config rewritten')
PY
if ! docker compose -p dsh-passkey-trial --project-directory "$root/trial" -f compose.trial.yaml -f compose.trial.override.yaml config --quiet; then
  echo "FAIL config invalid; restoring"; cp -a "$backup" compose.trial.yaml; up oauth2-proxy oauth2-proxy-agent; exit 1
fi
# 2) GUI非依存ゲートから更新
up oauth2-proxy
if ! wait_ping 14180; then
  echo "FAIL staging gate; restoring"; cp -a "$backup" compose.trial.yaml; up oauth2-proxy; exit 1
fi
echo "staging gate OK"
# 3) GUI経路ゲートを更新（数秒断）
up oauth2-proxy-agent
if ! wait_ping 14181; then
  echo "FAIL agent gate; restoring"; cp -a "$backup" compose.trial.yaml; up oauth2-proxy oauth2-proxy-agent; exit 1
fi
echo "agent gate OK"
if [ "$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:14445/)" = 302 ]; then echo "entry 8445 OK"; else echo "WARN entry 8445 unexpected"; fi
echo "apply-strict-issuer done $(date -Is)"
} >> "$log" 2>&1
