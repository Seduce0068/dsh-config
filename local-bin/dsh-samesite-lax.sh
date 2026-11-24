#!/usr/bin/env bash
# Re-apply the SameSite=Lax compatibility patch after npm updates.
# dsh 0.2.2-rc.1 hardcodes SameSite=Strict, which Android/Edge withholds on a
# cold PWA launch (cross-site top-level navigation), producing a 401.
# Upstream issue: https://github.com/deepseek-ai/deepseek-harness/discussions/5362
set -euo pipefail

target="<home>/.npm-global/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/index.js"
[ -f "$target" ] || exit 0

if grep -q 'SameSite=Strict' "$target"; then
	sed -i 's/SameSite=Strict/SameSite=Lax/g' "$target"
fi
