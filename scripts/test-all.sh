#!/usr/bin/env bash

set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo
echo "=========================================="
echo " SentinelAI — Full Verification"
echo "=========================================="
echo

echo "[1/4] ML"
source "$ROOT/ml/.venv/bin/activate"

ruff check ml/src ml/tests
ruff format --check ml/src ml/tests
PYTHONPATH="$ROOT/ml/src" pytest -q ml/tests

deactivate

echo
echo "[2/4] API"
source "$ROOT/api/.venv/bin/activate"

export PYTHONPATH="$ROOT:$ROOT/ml/src"
export TEST_DATABASE_URL="${TEST_DATABASE_URL:-postgresql+psycopg://sentinelai:sentinelai_dev@127.0.0.1:5432/sentinelai_test}"
export DATABASE_URL="$TEST_DATABASE_URL"

ruff check api/app api/tests
ruff format --check api/app api/tests
alembic -c api/alembic.ini upgrade head
pytest -q api/tests

deactivate

echo
echo "[3/4] Frontend"
cd "$ROOT/frontend"

npx tsc -b
npm run build

cd "$ROOT"

echo
echo "[4/4] Git status"
git status --short

echo
echo "=========================================="
echo " SENTINELAI VERIFICATION PASSED"
echo "=========================================="
