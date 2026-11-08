#!/usr/bin/env bash
# Create local-test credentials safely. Existing keys/database are never reset.
# Existing secrets are verified without printing their values.
set -euo pipefail
script_dir="$(dirname -- "${BASH_SOURCE[0]}")"
exec python3 "${script_dir}/staging_env.py" "$@"
