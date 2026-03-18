#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VENV_DIR="${VENV_DIR:-.venv}"

if [[ ! -x "${VENV_DIR}/bin/python" ]]; then
  python3 -m venv "$VENV_DIR"
fi

"${VENV_DIR}/bin/python" -m pip install --upgrade pip >/dev/null
"${VENV_DIR}/bin/python" -m pip install -r requirements.txt >/dev/null

"${VENV_DIR}/bin/python" scripts/make_lead.py "$@"

