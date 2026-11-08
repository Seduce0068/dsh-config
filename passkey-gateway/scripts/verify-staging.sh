#!/usr/bin/env bash
# Local mocks and fresh disposable DB only. Never reuses or stops an existing project.
# --keep is intentionally unsupported; tests always remove their own containers.
set -euo pipefail
script_dir="$(dirname -- "${BASH_SOURCE[0]}")"
exec python3 "${script_dir}/verify_staging.py" "$@"
