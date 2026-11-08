# スマホからDSHへアクセスする（2026-11-09 調査・解決）

## 症状
スマホ（Edge Android）でパスキー認証は成功する（Pocket ID監査ログにSIGN_INあり）が、
その後にDSHへ入れない。

## 原因（2層認証の2段目で停止）
- 第1層: パスキーゲート（oauth2-proxy）— **成功している**
- 第2層: DSH本体の認証（起動トークン→署名Cookie、Max-Age 30日）
  - DSHは `/?token=<launch token>` でCookie（`dsh-auth-<sha256(authority)>`）を発行する
  - ゲートの未認証リダイレクトは `rd=https://<host>:8445/` を**固定文字列**で作るため、
    `?token=` がログイン後の戻り先から**落ちる**
  - デスクトップは以前にDSH Cookieを取得済みのため動作していた
- 検証: DSH本体へHostヘッダー付きで `/?token=` → 303+Cookie、以降 `200` を確認済み

## 解決策（ワンタイムURL）
パスキー後にトークン付きURLへ戻る専用リンクを発行する:
```
https://<host>:8445/oauth2/start?rd=<urlencoded https://<host>:8445/?token=TOKEN>
```
- このURLは `/oauth2/start` を使うため、**パスキー認証後に**トークンURLへ着地する
- スマホで一度開けばDSH Cookie（30日）が保存され、以後は
  `https://<host>:8445/` をブックマークするだけで**パスキーのみ**で入れる
- Cookieの署名鍵はDSH_HOMEに永続化されるため、DSH再起動でも維持される

## 発行物
- `inbox/phone-login-qr.png`（スマホで読み取り）
- `inbox/phone-login-url.txt`（テキストURL）
- いずれも一時ファイル（使用後は削除推奨）
- トークンは起動ごとに変わる。Cookieが消えた/期限切れ(30日)時のみ再発行すればよい

## 恒久改善（任意）
Caddyの未認証リダイレクトを `rd={scheme}://{host}{uri}` にして元のクエリを保持すれば、
トークン付きURLを直接開くだけで済む。ただしURLエンコードとゲート再起動が必要。
