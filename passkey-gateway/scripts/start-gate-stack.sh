#!/usr/bin/env bash
# DSHパスキーゲート一式を「正しい順序」で起動する。
# 起動順: Pocket ID(register) → 入口Caddy(login) → 試用/本番ゲート(trial)
# 失敗しても既存のDSH(:3080/:3081)には触れない。
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
wait_docker() {
	for _ in $(seq 1 60); do
		docker info >/dev/null 2>&1 && return 0
		sleep 2
	done
	return 1
}
wait_http() {
	local url="$1"
	for _ in $(seq 1 60); do
		curl -q --noproxy '*' -fsS --max-time 2 "$url" >/dev/null 2>&1 && return 0
		sleep 2
	done
	return 1
}

# compose up を数回再試行する（一時的なDocker/Pocket ID遅延に耐える）
retry_up() {
	for attempt in 1 2 3; do
		if docker compose "$@" up -d; then
			return 0
		fi
		sleep 5
	done
	return 1
}

wait_docker

# 1. 本人確認サービス（Pocket ID）
retry_up -p dsh-passkey-register \
	--project-directory "$root/register" \
	-f "$root/register/compose.register.yaml"
wait_http "http://127.0.0.1:14111/.well-known/openid-configuration"

# 2. :8443 と :8445 の入口Caddy
retry_up -p dsh-passkey-login \
	--project-directory "$root/login-entry" \
	-f "$root/login-entry/compose.login.yaml"

# 3. 認証ゲート（oauth2-proxy 2台 + 内部Caddy）
retry_up -p dsh-passkey-trial \
	--project-directory "$root/trial" \
	-f "$root/trial/compose.trial.yaml" \
	-f "$root/trial/compose.trial.override.yaml"

# 4. 起動後の確認（ログに出すだけ。失敗してもDSHは無傷）
curl -q --noproxy '*' -s -o /dev/null -w 'register /setup: %{http_code}\n' --max-time 5 http://127.0.0.1:14443/setup || true
curl -q --noproxy '*' -s -o /dev/null -w 'agent gate:      %{http_code}\n' --max-time 5 http://127.0.0.1:14445/ || true
