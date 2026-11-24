# Git グローバル設定（testuser / Kubuntu 2026.04）

`~/.gitconfig` と `~/.config/git/ignore` のバックアップ、および公開参照用の
設定例。

## 現状

- **グローバル設定**: `~/.gitconfig` に `user.*` / `credential.*.helper` /
  `core.excludesfile` を保持。トークンは埋め込まれておらず、
  `gh auth git-credential` を呼び出す方式。
- **システム設定**: `/etc/gitconfig` に `init.defaultBranch = master` を設定。
  root 所有のため、更新時はパスキー経由の `agent-sudo.sh` を使う。

## 構成

```
git/
├── config/
│   ├── gitconfig        # ~/.gitconfig（実設定）
│   ├── gitignore        # ~/.config/git/ignore（グローバル ignore）
│   └── system-gitconfig # /etc/gitconfig（システム設定）
├── gitconfig.example  # 公開参照用（user 情報をプレースホルダ化、
│                      # <home> を ${HOME} に置換）
└── README.md
```

## 復元手順

```bash
# 1. グローバル設定
cp git/config/gitconfig ~/.gitconfig
chmod 600 ~/.gitconfig

# 2. グローバル ignore
mkdir -p ~/.config/git
cp git/config/gitignore ~/.config/git/ignore
chmod 600 ~/.config/git/ignore

# 3. 認証は gh CLI に依存するため、先にログインしておく
gh auth status

# 4. システム設定（root 権限が必要・パスキー承認）
passkey-gateway/scripts/agent-sudo.sh /tmp/sudo-url.txt -- \
  cp git/config/system-gitconfig /etc/gitconfig
```

## 秘密情報の方針

- `user.name` / `user.email` は個人情報のため、`gitconfig.example` では
  `<your-name>` / `<your-email>` に置換している。
- `credential.*.helper` はトークンではなく `gh auth git-credential` への
  参照のみ。トークン自体は `gh` の認証ストアに任せる。
- 実設定（`config/`）は private リポジトリ内に留め、public 化する場合は
  `gitconfig.example` のみを対象にする。

## 検証

```bash
git config --file git/config/gitconfig --list >/dev/null
git config --file git/config/system-gitconfig --list >/dev/null
git config --file git/gitconfig.example --list >/dev/null
grep -icE '(ghp_|github_pat_|gho_|ghu_|ghs_|ghr_|password[[:space:]]*=|token[[:space:]]*=)' git/config/gitconfig
# 期待値: 0
```
