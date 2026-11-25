#!/usr/bin/env bash
# dsh-config の設定例・リンクの静的検証（JSONC/テンプレート対応）
set -uo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
fail=0
python3 - "$repo" <<'PY' || fail=1
import json, pathlib, re, sys
root = pathlib.Path(sys.argv[1])
bad = []

def strip_jsonc(t: str) -> str:
    out = []
    i, n = 0, len(t)
    in_str = False
    while i < n:
        c = t[i]
        if in_str:
            out.append(c)
            if c == '\\' and i + 1 < n:
                out.append(t[i+1]); i += 2; continue
            if c == '"':
                in_str = False
            i += 1; continue
        if c == '"':
            in_str = True; out.append(c); i += 1; continue
        if c == '/' and i + 1 < n and t[i+1] == '/':
            while i < n and t[i] != '\n': i += 1
            continue
        if c == '/' and i + 1 < n and t[i+1] == '*':
            i += 2
            while i + 1 < n and not (t[i] == '*' and t[i+1] == '/'): i += 1
            i += 2; continue
        out.append(c); i += 1
    return ''.join(out)

json_files = list(root.rglob('*.json')) + list(root.rglob('*.jsonc'))
for p in json_files:
    if 'node_modules' in p.parts:
        continue
    try:
        json.loads(strip_jsonc(p.read_text(errors='ignore')))
    except Exception as e:
        bad.append(f'JSON {p.relative_to(root)}: {str(e)[:60]}')

try:
    import yaml
    class L(yaml.SafeLoader):
        pass
    L.add_multi_constructor('tag:yaml.org,2002:js', lambda l, s, n: None)
    for p in list(root.rglob('*.yml')) + list(root.rglob('*.yaml')):
        t = p.read_text(errors='ignore')
        if '{{' in t:  # テンプレートは対象外
            continue
        try:
            yaml.load(t, Loader=L)
        except Exception as e:
            bad.append(f'YAML {p.relative_to(root)}: {str(e)[:60]}')
except ImportError:
    pass

md_files = [p for p in root.rglob('*.md')
            if not ({'node_modules', '.git'} & set(p.parts))]
for md in md_files:
    text = re.sub(r'```.*?```', '', md.read_text(encoding='utf-8'), flags=re.S)
    for m in re.finditer(r'\[[^\]]+\]\(([^)]+)\)', text):
        t = m.group(1).split('#')[0]
        if not t or t.startswith(('http', 'mailto:')):
            continue
        if '{{' in t or '<' in t:  # テンプレート・プレースホルダは対象外
            continue
        if not (md.parent / t).resolve().exists():
            bad.append(f'LINK {md.relative_to(root)}: {t}')

print(f'  checked: json={len(json_files)} / links={len(md_files)} files')
if bad:
    print(f'  NG: {len(bad)}')
    for b in bad:
        print('   ', b)
    sys.exit(1)
print('  OK: 設定例・リンクすべて有効')
PY
exit "$fail"
