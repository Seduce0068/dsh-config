#!/usr/bin/env bash
# 全ローカルGitリポジトリの .gitignore/秘匿ファイル/大ファイル監査（読み取り専用）
set -uo pipefail
root=<home>/document/deepseek-harness/default-workspace/passkey-gateway
out="$root/docs/gitignore-audit-2026-11-09.md"
python3 - "$out" <<'PY'
import subprocess, pathlib, sys, re, json, datetime

out_path = pathlib.Path(sys.argv[1])

def git(p, *args):
    try:
        return subprocess.run(['git','-C',str(p),*args], capture_output=True, text=True, timeout=20).stdout.strip()
    except Exception:
        return ''

# リポジトリ探索
cands, seen = set(), set()
for base in ['<home>', '<home>/ドキュメント/作業用', '<home>/ドキュメント/作業用/rustscript',
             '<home>/ドキュメント/作業用/userscript', '<home>/ドキュメント/作業用/jarvis',
             '<home>/ドキュメント/作業用/opencode_opencoderust/opencoderust',
             '<home>/.config', '<home>/.openclaw', '<home>/.codex',
             '<home>/repos/Seduce0068']:
    b = pathlib.Path(base)
    if not b.exists(): continue
    for p in list(b.iterdir()) + list(b.glob('*/*')):
        if (p/'.git').exists():
            r = p.resolve()
            if r not in seen:
                seen.add(r); cands.add(p)

SENSITIVE = re.compile(r'(^|/)(\.env(\..+)?|\.npmrc|\.pypirc|\.netrc|credentials(\.json)?|secrets?(\.json|\.ya?ml)?|id_(rsa|ed25519|ecdsa)|.*\.(pem|key|p12|pfx|jks|kdbx)|.*\.(token|secret))$', re.I)
BUILD = re.compile(r'(^|/)(target|node_modules|dist|build|out|\.venv|venv|__pycache__|\.pytest_cache|\.next|\.turbo|\.cache)(/|$)')
JUNK = re.compile(r'(^|/)(\.DS_Store|Thumbs\.db|\.idea|\.vscode|\.swp|.*~)$')
SECRET_PAT = re.compile(r'(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{10,})')

rows = []
for p in sorted(cands):
    name = str(p).replace('<home>/','')
    gi = p/'.gitignore'
    gi_lines = []
    if gi.exists():
        try: gi_lines = [l.strip() for l in gi.read_text(errors='ignore').splitlines() if l.strip() and not l.startswith('#')]
        except Exception: pass
    tracked = git(p,'ls-files').splitlines()
    tracked_sens = [f for f in tracked if SENSITIVE.search(f)]
    tracked_build = [f for f in tracked if BUILD.search(f)]
    tracked_junk = [f for f in tracked if JUNK.search(f)]
    untracked_sens = git(p,'ls-files','--others','--exclude-standard').splitlines()
    untracked_sens = [f for f in untracked_sens if SENSITIVE.search(f)]
    # 大きい追跡ファイル（>1MiB）
    big = []
    try:
        tree = subprocess.run(['git','-C',str(p),'ls-tree','-r','-l','HEAD'],
                              capture_output=True, text=True, timeout=20).stdout
        for line in tree.splitlines():
            parts = line.split('\t',1) + [''] if '\t' in line else line.split(None,4)
            try:
                m = line.split()
                size = int(m[3]); f = line.split('\t',1)[1]
            except Exception:
                continue
            if size > 1024*1024:
                big.append((f, size))
    except Exception:
        pass
    # 追跡ファイルの秘匿値スキャン（テキストのみ・最大20ファイル）
    leaked = []
    for f in tracked[:400]:
        fp = p/f
        if not fp.is_file() or fp.stat().st_size > 512*1024: continue
        try: txt = fp.read_text(errors='ignore')
        except Exception: continue
        m = SECRET_PAT.search(txt)
        if m: leaked.append((f, m.group(0)[:8] + '...'))
        if len(leaked) >= 5: break
    rows.append(dict(path=name, repo=str(p), remote=git(p,'remote','get-url','origin'), branch=git(p,'branch','--show-current'),
                     gi=bool(gi_lines), gi_count=len(gi_lines), tracked=len(tracked),
                     tracked_sens=tracked_sens[:5], n_sens=len(tracked_sens),
                     tracked_build=tracked_build[:5], n_build=len(tracked_build),
                     tracked_junk=tracked_junk[:5], untracked_sens=untracked_sens[:5], n_untracked_sens=len(untracked_sens),
                     big=sorted(big, key=lambda x:-x[1])[:3], leaked=leaked))

# グローバル設定
glob_excl = subprocess.run(['git','config','--global','core.excludesFile'], capture_output=True, text=True).stdout.strip()

lines = []
now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
lines.append(f'# .gitignore 監査レポート（{now}）\n')
lines.append(f'- ローカルGitリポジトリ: **{len(rows)}件**')
lines.append(f'- グローバル core.excludesFile: `{glob_excl or "(未設定)"}`')
missing = sum(1 for r in rows if not r['gi'])
lines.append(f'- `.gitignore` なし: **{missing}件**')
lines.append('')
lines.append('## 1. 重大（追跡されている秘匿系ファイル）\n')
crit = [r for r in rows if r['n_sens'] > 0 or r['leaked']]
if crit:
    lines.append('| リポジトリ | 追跡秘匿ファイル | 内容の秘匿値 |')
    lines.append('|---|---|---|')
    for r in crit:
        lines.append(f"| `{r['path']}` | {', '.join(f'`{x}`' for x in r['tracked_sens']) or '-'} | {', '.join(f'`{x[0]}`' for x in r['leaked']) or '-'} |")
else:
    lines.append('- なし（追跡されている秘匿ファイル・秘匿値は検出されず）')
lines.append('')
lines.append('## 2. 警告（未追跡だがignoreされていない秘匿ファイル）\n')
warn = [r for r in rows if r['n_untracked_sens'] > 0]
if warn:
    for r in warn:
        lines.append(f"- `{r['path']}`: {', '.join(f'`{x}`' for x in r['untracked_sens'])} → `.gitignore` 追加推奨")
else:
    lines.append('- なし')
lines.append('')
lines.append('## 3. ビルド成果物が追跡されているリポジトリ\n')
bd = [r for r in rows if r['n_build'] > 0]
if bd:
    for r in bd:
        lines.append(f"- `{r['path']}`: {r['n_build']}件（例: {', '.join(f'`{x}`' for x in r['tracked_build'])}）")
else:
    lines.append('- なし')
lines.append('')
lines.append('## 4. 巨大ファイル（追跡・>1MiB）\n')
bigrows = [r for r in rows if r['big']]
if bigrows:
    for r in bigrows:
        ex = ', '.join(f'`{f}` ({s//1024}KiB)' for f,s in r['big'])
        lines.append(f"- `{r['path']}`: {ex}")
else:
    lines.append('- なし')
lines.append('')
lines.append('## 5. .gitignoreがないリポジトリ\n')
for r in rows:
    if not r['gi']:
        lines.append(f"- `{r['path']}`（追跡{r['tracked']}件, remote={r['remote'] or 'なし'}）")
if not missing:
    lines.append('- なし')
lines.append('')
lines.append('## 6. リポジトリ別 概要\n')
lines.append('| リポジトリ | .gitignore | 行数 | 追跡 | 追跡秘匿 | 追跡ビルド | 未ignore秘匿 |')
lines.append('|---|---|---|---|---|---|---|')
for r in sorted(rows, key=lambda x: x['path']):
    lines.append(f"| `{r['path']}` | {'✓' if r['gi'] else '**✗**'} | {r['gi_count']} | {r['tracked']} | {r['n_sens']} | {r['n_build']} | {r['n_untracked_sens']} |")
out_path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(f'  report: {out_path}')
print(f'  repos={len(rows)} missing_gitignore={missing} critical={len(crit)} warn={len(warn)}')
PY
