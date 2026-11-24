# Tailscale脱却の可否調査（2026-11-09）

## 結論
**技術的には脱却可能だが、無条件ではない。**
- **LAN内だけ**なら比較的現実的（ただしTLS基盤の作り直しと**パスキー再登録が必須**）
- **リモートアクセスを維持**するなら、Tailscale相当の代替（Cloudflare Tunnel / Headscale+VPS / WireGuard）が必要
- 本環境は**docomo HOME 5G**でIPv4はCGNATの可能性が高く、**自前のポート開放によるリモート公開は現実的でない**
- 最大の移行障壁は**パスキーのRP ID（オリジン束縛）**で、ホスト名変更＝全パスキー再登録

## 1. 現在Tailscaleが担っている役割
| 役割 | 詳細 | 代替の難易度 |
|---|---|---|
| リモート到達 | スマホ等をtailnet経由で接続 | 高（CGNATのため要トンネル/VPS） |
| TLS終端・証明書 | Serveが`*.ts.net`証明書でHTTPS終端。内側Caddyは**HTTPのみ** | 中〜高（ドメイン＋ACME/Caddy TLS化） |
| DNS/名前 | MagicDNS + `*.ts.net` ホスト名 | 中（LAN DNS/内部CA/独自ドメイン） |
| 公開ポート | `/`→18890, `:8443`→14443, `:8445`→14445 | 低（Caddyで直接待受） |
| 認証オリジン | Pocket IDのAPP_URL・OIDC issuer・DSH Cookieのauthority | **高（パスキー再登録）** |
| ACL/ID | tailnet ACL・ノード認証 | 中（アプリ側のパスキーで代替可） |

## 2. ネットワーク環境（実測）
- LAN: `<private-ip>/24`、GW `<private-ip>`（HR02）
- 公開IPv4: `<PUBLIC_IP>`（docomo 5G帯）→ **共有アドレス(CGNAT)の可能性大**
- IPv6: グローバルあり（`240a:61:.../64`）だが**HR02のIPv6ファイアウォール次第**で受信不可の可能性
- tracerouteは全ホップ無応答（ICMP/UDP制限）で経路確認不可
- AdGuard Homeは稼働中だがDNSは **127.0.0.54:53（ローカル限定）**。LAN向けDNSには未使用
- cloudflared / certbot / lego / caddy(ホスト) はいずれも未導入

## 3. 移行の必須条件と障壁
### (a) パスキーRP ID（最重要）
- Pocket ID `APP_URL=https://onoderakeita-systemproductname.<tailnet>:8443`
- WebAuthnのパスキーは**このホスト名に暗号学的に束縛**される
- したがって**ホスト名を変える＝既存パスキーは全て無効**。ログインできない状態になるため、
  移行前に「新オリジンでのパスキー登録手段」を確保する必要がある（Pocket IDの回復/一時トークン等の
  サポート有無を事前検証すべき）
- WebAuthnは**HTTPS必須かつIPアドレスはRP IDに不可** → **ドメイン名は必須**（社内/内部CAでも可）

### (b) TLS終端の移設
- 現在はTailscale ServeがTLS終端。脱却時はCaddyをTLS終端に変更し、
  証明書を (i) 独自ドメイン+ACME(DNS-01/HTTP-01) または (ii) 内部CA（端末にCA証明書配布）で用意

### (c) DNS
- LAN内: AdGuard HomeをLANバインドし、対象ホスト名を`<private-ip>`へ書き換え
- ルーター(HR02)のDHCPでDNSをAdGuardに向けられるか要確認

### (d) リモート経路
- CGNATのためポートフォワード不可の可能性が高い
- 代替: Cloudflare Tunnel（アウトバウンドのみ、独自ドメイン必須）／VPS上のWireGuard／Headscale

## 4. 選択肢の比較
| 案 | リモート維持 | ドメイン | 追加コスト | 運用負荷 | パスキー |
|---|---|---|---|---|---|
| **現状維持（Tailscale）** | ○ | 不要 | 無料 | 低 | 現状のまま |
| **LAN専用化** | **×**（LANのみ） | 内部CAでも可 | 無料 | 中 | **再登録** |
| **Cloudflare Tunnel** | ○（CGNAT可） | **必要**（年約$10〜） | 低 | 中 | **再登録** |
| **Headscale + VPS** | ○ | 必要 | VPS 月$3〜 | 高 | **再登録** |
| **WireGuard VPS + LAN DNS** | ○ | 内部CAでも可 | VPS 月$3〜 | 高 | **再登録** |

## 5. 推奨
1. **目的が「SaaS依存の回避」**なら Cloudflare Tunnel（独自ドメイン）が最も現実的。
   CGNATを回避でき、TLSも自動。ただし**パスキー再登録の移行計画**が必須。
2. **目的が「LAN内の簡素化」だけ**なら、内部CA（Caddy）＋`.home.arpa`等＋AdGuard DNSで脱却可能。
   ただし**リモートアクセスは失う**（VPS VPNを別途用意するなら維持可）。
3. **Tailscaleの運用に不満がないなら、脱却の便益は小さい**。移行コスト（TLS/DNS/パスキー）が便益を上回りやすい。

## 6. 移行する場合の段階的手順（案）
1. ドメイン取得（Cloudflare管理）または内部CA運用の決定
2. パスキー移行手段の検証（Pocket IDの回復/一時ログイン手段）
3. 新ホスト名でCaddy TLS・DNS・アプリ設定を**Tailscaleと併存**させて構築
4. 新オリジンでパスキー再登録・全機能確認
5. 旧tailnet公開を停止 → Tailscale削除
6. 監視・バックアップ・健康点検のホスト名/証明書チェックを更新

## 7. 影響範囲（脱却時に更新が必要）
- `register/pocket-id.env`（APP_URL）
- `trial/compose.trial.yaml`（login-url、issuer、ホスト名）
- Caddyfile群（Host検証・リスナ・TLS）
- 健康点検（Hostチェック・証明書期限チェック）
- 監視/watchdog（Serveマッピング復元処理の削除）
- ドキュメント一式・スマホのブックマーク/PWA（再登録）
