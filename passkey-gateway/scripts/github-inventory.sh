#!/usr/bin/env bash
# 個人リポジトリの棚卸し（ローカル vs GitHub）。読み取り専用。
# 出力: passkey-gateway/docs/github-inventory-latest.md
set -uo pipefail
root=/home/koppe/document/deepseek-harness/default-workspace/passkey-gateway
out="$root/docs/github-inventory-latest.md"
env_file=/home/koppe/.config/opencode/dsh.env
token=$(grep -oE '^GITHUB_MCP_TOKEN=.*' "$env_file" 2>/dev/null | cut -d= -f2-)
if [ -z "${token:-}" ]; then
	echo "GITHUB_MCP_TOKEN が見つかりません" >&2; exit 1
fi
gh=/tmp/gh-inventory-$$.json
# トークンはstdin経由（argvに出さない）
printf 'header = "Authorization: Bearer %s"\nheader = "Accept: application/vnd.github+json"\nuser-agent = "dsh-inventory"\nurl = "https://api.github.com/user/repos?per_page=100&affiliation=owner&sort=updated"\n' "$token" | curl -q --noproxy '*' -sS -K - -o "$gh" || { echo "GitHub API 失敗" >&2; rm -f "$gh"; exit 1; }
unset token

python3 - "$gh" "$out" <<'PY'
import json, subprocess, pathlib, sys, datetime

gh_path, out_path = sys.argv[1], sys.argv[2]
gh = json.load(open(gh_path))

cands = set()
seen_real = set()
for base in ['/home/koppe', '/home/koppe/ドキュメント/作業用', '/home/koppe/ドキュメント/作業用/rustscript',
             '/home/koppe/ドキュメント/作業用/userscript', '/home/koppe/ドキュメント/作業用/jarvis',
             '/home/koppe/.config', '/home/koppe/.openclaw', '/home/koppe/.codex',
             '/home/koppe/repos/onoderakeita',
             '/home/koppe/ドキュメント/作業用/opencode_opencoderust/opencoderust']:
    b = pathlib.Path(base)
    if not b.exists():
        continue
    for p in list(b.iterdir()) + list(b.glob('*/*')):
        if (p / '.git').exists():
            real = p.resolve()
            if real not in seen_real:
                seen_real.add(real)
                cands.add(p)

def git(p, *args):
    try:
        return subprocess.run(['git', '-C', str(p), *args], capture_output=True, text=True, timeout=10).stdout.strip()
    except Exception:
        return ''

locals_ = []
for p in sorted(cands):
    url = git(p, 'remote', 'get-url', 'origin')
    remote = None
    if 'github.com' in url:
        s = url.split('github.com')[-1].lstrip(':/')
        remote = s[:-4] if s.endswith('.git') else s
    branch = git(p, 'branch', '--show-current')
    head = git(p, 'rev-parse', '--short=8', 'HEAD')
    dirty = len([l for l in git(p, 'status', '--porcelain').splitlines() if l])
    ahead = behind = None
    if remote:
        a = git(p, 'rev-list', '--count', '@{u}..HEAD')
        b = git(p, 'rev-list', '--count', 'HEAD..@{u}')
        ahead = int(a) if a.isdigit() else None
        behind = int(b) if b.isdigit() else None
    locals_.append(dict(path=str(p), remote=remote, branch=branch, head=head,
                        dirty=dirty, ahead=ahead, behind=behind))

gh_by_name = {r['full_name']: r for r in gh}
local_by_remote = {r['remote']: r for r in locals_ if r['remote']}
personal = {k: v for k, v in gh_by_name.items() if k.startswith('onoderakeita/')}
now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')

lines = []
lines.append(f'# GitHub 個人リポジトリ棚卸し（{now}）\n')
lines.append(f'- GitHub側リポジトリ: **{len(personal)}件**（オーナー所有）')
lines.append(f'- ローカルで検出したGitリポジトリ: **{len(locals_)}件**')
lines.append('')
lines.append('## 1. 要対応（ローカルに未コミット変更）\n')
lines.append('| ローカルパス | ブランチ | 未コミット | GitHub | 状態 |')
lines.append('|---|---|---|---|---|')
dirty_rows = [r for r in locals_ if r['dirty'] > 0]
for r in sorted(dirty_rows, key=lambda x: -x['dirty']):
    g = '連携あり' if r['remote'] in personal else ('第三者' if r['remote'] else '**リモートなし**')
    lines.append(f"| `{r['path']}` | {r['branch'] or '-'} | **{r['dirty']}** | {g} | {'要push' if r['ahead'] else 'バックアップ対象'} |")
if not dirty_rows:
    lines.append('| （なし） | | | | |')
lines.append('')
lines.append('## 2. 未pushコミット（ローカルが進んでいる）\n')
ahead_rows = [r for r in locals_ if (r['ahead'] or 0) > 0 and r['remote'] in personal]
if ahead_rows:
    lines.append('| ローカルパス | ブランチ | 未push |')
    lines.append('|---|---|---|')
    for r in ahead_rows:
        lines.append(f"| `{r['path']}` | {r['branch']} | {r['ahead']} |")
else:
    lines.append('- なし（個人リポジトリはすべて同期済み）')
lines.append('')
lines.append('## 3. GitHubにあるがローカル未clone\n')
missing = sorted(k for k in personal if k not in local_by_remote)
if missing:
    for k in missing:
        lines.append(f"- `{k}`（default: {personal[k]['default_branch']}, private={personal[k]['private']}）")
else:
    lines.append('- なし')
lines.append('')
lines.append('## 4. ローカルのみ（GitHubリモートなし）\n')
no_remote = [r for r in locals_ if not r['remote']]
if no_remote:
    for r in no_remote:
        lines.append(f"- `{r['path']}`（{r['branch'] or '-'}, 未コミット {r['dirty']}）")
else:
    lines.append('- なし')
lines.append('')
dup = {}
for r in locals_:
    if r['remote'] and r['remote'].startswith('onoderakeita/'):
        dup.setdefault(r['remote'], []).append(r['path'])
lines.append('## 5. 重複クローン（同一個人リモートの複数ローカル）\n')
dups = {k: v for k, v in dup.items() if len(v) > 1}
if dups:
    for k, v in sorted(dups.items()):
        lines.append(f"- `{k}`: " + ' / '.join(f'`{x}`' for x in v))
else:
    lines.append('- なし')
lines.append('')
lines.append('## 6. GitHub未確認のリモート（PATの選択範囲外/改名/削除の可能性）\n')
broken = [r for r in locals_ if r['remote'] and r['remote'].startswith('onoderakeita/') and r['remote'] not in gh_by_name]
if broken:
    for r in broken:
        lines.append(f"- `{r['path']}` → `{r['remote']}`（APIから見えない: PAT対象外か改名/削除）")
else:
    lines.append('- なし')
lines.append('')
lines.append('## 7. 個人リポジトリ一覧（GitHub）\n')
lines.append('| リポジトリ | default | private | 最終push | open issues |')
lines.append('|---|---|---|---|---|')
for k in sorted(personal):
    r = personal[k]
    lines.append(f"| `{k}` | {r['default_branch']} | {r['private']} | {r['pushed_at'][:10]} | {r['open_issues_count']} |")
lines.append('')
lines.append('## 8. 第三者clone（参考・管理対象外）\n')
third = [r for r in locals_ if r['remote'] and r['remote'] not in personal]
for r in sorted(third, key=lambda x: x['path']):
    extra = []
    if (r['behind'] or 0) > 0: extra.append(f"遅れ{r['behind']}")
    if r['dirty']: extra.append(f"変更{r['dirty']}")
    lines.append(f"- `{r['path']}` ({r['remote']}){' / '.join(extra) if extra else ''}")
lines.append('')
lines.append('_読み取り専用の自動レポート。ローカルリポジトリの状態とGitHub APIの突合結果。_')
pathlib.Path(out_path).write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(f'  作成: {out_path}')
print(f"  要対応(未コミット): {len(dirty_rows)}件 / 未push: {len(ahead_rows)}件 / 未clone: {len(missing)}件")
PY
rm -f "$gh"
