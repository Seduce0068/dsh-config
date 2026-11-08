{
	admin off
	auto_https off
	persist_config off
}

# :8443 の唯一の入口。Tailscale Serve が TLS を終端する。
# ここで Pocket ID と認証ゲートを同じオリジンに束ねる（TLS の入れ子を作らない）。
:14443 {
	bind 127.0.0.1
	@wrong_host not host onoderakeita-systemproductname.tailb706b0.ts.net
	respond @wrong_host "invalid host" 400

	@stale_asset path /_assets/* /_app/immutable/*.*.map
	respond @stale_asset "stale asset" 404
	header {
		Cache-Control "no-store"
	}

	# 認証ゲート本体内のログイン処理（OIDC callback 含む）
	handle /oauth2/* {
		reverse_proxy 127.0.0.1:14180 {
			header_up X-Real-IP {remote_host}
			header_up X-Forwarded-Proto https
			header_up X-Forwarded-Host {host}
			header_up X-Forwarded-Uri {uri}
		}
	}

	# 試用パス（パスキー認証後に DSH へ）
	handle /trial* {
		reverse_proxy 127.0.0.1:18888 {
			# 試用CaddyはHostを検査するため、入口から受け取ったHostをそのまま渡す。
			# ポートを保持し、DSH の Cookie authority を host:8443 に固定する。
			# これにより 443 / agentrouter の Cookie（host）と衝突しない。
			header_up Host {hostport}
			header_up X-Forwarded-Proto https
		}
	}

	# 初回管理者作成は完了済み。露出した /setup を閉じる（必要時は一時的に外す）。
	@setup_blocked path /setup
	respond @setup_blocked "not found" 404

	# それ以外は Pocket ID 本体
	reverse_proxy 127.0.0.1:14111 {
		header_up Host {host}
		header_up X-Forwarded-Proto https
		header_up X-Real-IP {remote_host}
		# クライアント指定のXFFを反射せず、実接続元で上書き（ログ偽装防止）
		header_up X-Forwarded-For {remote_host}
	}
}

# :8445 の入口。agentrouter をパスキーゲートの背後に置く。
# authority を host:8445 に固定し、web (host / host:8443) と Cookie を分離する。
:14445 {
	bind 127.0.0.1

	header {
		Cache-Control "no-store"
	}

	handle /oauth2/* {
		reverse_proxy 127.0.0.1:14181 {
			header_up X-Real-IP {remote_host}
			header_up X-Forwarded-Proto https
			header_up X-Forwarded-Host {hostport}
			header_up X-Forwarded-Uri {uri}
		}
	}

	handle {
		reverse_proxy 127.0.0.1:18889 {
			header_up Host {hostport}
			header_up X-Forwarded-Proto https
		}
	}
}
