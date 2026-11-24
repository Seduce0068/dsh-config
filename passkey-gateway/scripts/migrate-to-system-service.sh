#!/usr/bin/env bash
# ゲート一式をシステムサービスへ移行し、dockerグループ依存を外す。
# 使い方（rootで実行）:
#   sudo bash migrate-to-system-service.sh [--remove-docker-group]
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "rootで実行してください" >&2; exit 1; }
root=<home>/document/deepseek-harness/default-workspace/passkey-gateway
H=onoderakeita-systemproductname.<tailnet>
remove_docker=0
[ "${1:-}" = "--remove-docker-group" ] && remove_docker=1

echo "=== 1. helper を更新 ==="
install -o root -g root -m 0700 "$root/scripts/root-helper.sh" /usr/local/sbin/dsh-root-helper

echo "=== 2. システムunitを作成 ==="
cat >/etc/systemd/system/dsh-passkey-stack.service <<UNIT
[Unit]
Description=DSH passkey gate stack (Pocket ID + entry Caddy + auth gates)
After=network-online.target docker.service
Wants=network-online.target docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=$root/scripts/start-gate-stack.sh
TimeoutStartSec=300
SuccessExitStatus=0

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable dsh-passkey-stack.service >/dev/null

echo "=== 3. user unit を停止・無効化 ==="
sudo -u testuser XDG_RUNTIME_DIR=/run/user/1000 systemctl --user stop dsh-passkey-stack.service 2>/dev/null || true
sudo -u testuser XDG_RUNTIME_DIR=/run/user/1000 systemctl --user disable dsh-passkey-stack.service 2>/dev/null || true

echo "=== 4. システムunitで起動 ==="
if ! systemctl start dsh-passkey-stack.service; then
  echo "失敗: user unit へ戻します"
  sudo -u testuser XDG_RUNTIME_DIR=/run/user/1000 systemctl --user enable --now dsh-passkey-stack.service
  exit 1
fi
ok=0
for i in $(seq 1 60); do
  a=$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:14180/ping 2>/dev/null || true)
  b=$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:14181/ping 2>/dev/null || true)
  c=$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:14182/ping 2>/dev/null || true)
  if [ "$a$b$c" = "200200200" ]; then ok=1; echo "復旧: ${i}s"; break; fi
  sleep 1
done
if [ "$ok" -ne 1 ]; then
  echo "検証失敗: ロールバックします"
  systemctl stop dsh-passkey-stack.service || true
  sudo -u testuser XDG_RUNTIME_DIR=/run/user/1000 systemctl --user enable --now dsh-passkey-stack.service || true
  exit 1
fi
echo "=== 5. 入口確認 ==="
for u in "https://$H/" "https://$H:8445/" "https://$H:8443/.well-known/openid-configuration"; do
  printf '  %-62s -> %s\n' "$u" "$(curl -q --noproxy '*' -s -o /dev/null -w '%{http_code}' --max-time 8 "$u")"
done

if [ "$remove_docker" -eq 1 ]; then
  echo "=== 6. testuser を docker グループから外す ==="
  gpasswd -d testuser docker
  echo "※ 反映には再ログイン（または newgrp）が必要。旧シェルでは docker が使える場合があります。"
fi
echo "完了。再起動後はシステムunitが自動起動します。"
