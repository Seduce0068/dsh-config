#!/usr/bin/env bash
# 個人AGENTS.md/Skillsをこのリポジトリのinstructions/へ同期（既定は乾燥実行）
# --apply: コピー実行 / --commit: コミット / --push: pushまで
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
home_dir="${HOME:-/home/koppe}"
apply=0
commit=0
push=0
for a in "$@"; do
  case "$a" in
    --apply) apply=1 ;;
    --commit)
      apply=1
      commit=1
      ;;
    --push)
      apply=1
      commit=1
      push=1
      ;;
  esac
done

copy() { # src dst
  if diff -q "$1" "$2" >/dev/null 2>&1; then
    echo "  [同一] ${2#"$repo"/}"
  else
    echo "  [更新] ${2#"$repo"/}"
    if [ "$apply" -eq 1 ]; then cp -a "$1" "$2"; fi
  fi
}

echo "== AGENTS.md =="
copy "$home_dir/.config/opencode/AGENTS.md" "$repo/instructions/AGENTS/config-opencode-AGENTS.md"
copy "$home_dir/.codex/AGENTS.md" "$repo/instructions/AGENTS/codex-AGENTS.md"
copy "$home_dir/.agents/AGENTS.md" "$repo/instructions/AGENTS/agents-AGENTS.md"
copy "$home_dir/document/deepseek-harness/default-workspace/AGENTS.md" "$repo/instructions/AGENTS/workspace-AGENTS.md"

echo "== Skills (canonical: ~/.config/opencode/skills) =="
src="$home_dir/.config/opencode/skills"
if [ -d "$src" ]; then
  for d in "$src"/*/; do
    n=$(basename "$d")
    if diff -rq "$d" "$repo/instructions/skills/$n" >/dev/null 2>&1; then
      echo "  [同一] skills/$n"
    else
      echo "  [更新] skills/$n"
      if [ "$apply" -eq 1 ]; then
        rm -rf "$repo/instructions/skills/$n"
        cp -a "$d" "$repo/instructions/skills/$n"
      fi
    fi
  done
fi

if [ "$apply" -eq 1 ]; then
  echo "== 秘密スキャン =="
  python3 - "$repo/instructions" <<'PY'
import pathlib, re, sys
root = pathlib.Path(sys.argv[1])
pats = [re.compile(r'github_pat_[A-Za-z0-9_]{30,}'), re.compile(r'ghp_[A-Za-z0-9]{30,}'),
        re.compile(r'sk-[A-Za-z0-9]{30,}'), re.compile(r'AKIA[0-9A-Z]{16}'),
        re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----')]
hits = [str(p) for p in root.rglob('*') if p.is_file() and p.stat().st_size < 512*1024
        and any(rx.search(p.read_text(errors='ignore')) for rx in pats)]
print('  secret hits:', len(hits))
if hits: sys.exit(2)
PY
  if [ "$commit" -eq 1 ]; then
    (cd "$repo" && git add instructions \
      && git -c user.name="${GIT_AUTHOR_NAME:-koppe}" -c user.email="${GIT_AUTHOR_EMAIL:-keitaonodera0903@gmail.com}" \
        commit -q -m "chore(instructions): 自動同期" || echo "  変更なし")
  fi
  if [ "$push" -eq 1 ]; then
    (cd "$repo" && git push origin master)
  fi
else
  echo "乾燥実行のみ（--apply でコピー、--commit/--push も可）"
fi
