#!/usr/bin/env bash

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "========================================"
echo " SentinelAI Session Snapshot"
echo "========================================"
echo

echo "Project:"
echo "  $(pwd)"
echo

echo "========================================"
echo " Git Status"
echo "========================================"
git status --short 2>/dev/null || true
echo

echo "========================================"
echo " Git Log — Last 20 Commits"
echo "========================================"
git log --oneline -20 2>/dev/null || echo "No commits yet."
echo

echo "========================================"
echo " Repository Tree"
echo "========================================"
find . \
  -path './.git' -prune -o \
  -path './venv' -prune -o \
  -path './.venv' -prune -o \
  -path './node_modules' -prune -o \
  -path './ml/data/raw' -prune -o \
  -print | sort
echo

echo "========================================"
echo " Python Test Summary"
echo "========================================"

if command -v pytest >/dev/null 2>&1; then
    pytest -q 2>&1 || true
else
    echo "pytest not installed."
fi

echo

echo "========================================"
echo " Frontend Test Summary"
echo "========================================"

if [ -f frontend/package.json ]; then
    if command -v npm >/dev/null 2>&1; then
        (
            cd frontend
            npm test -- --run 2>&1 || true
        )
    else
        echo "npm not installed."
    fi
else
    echo "Frontend not scaffolded yet."
fi

echo

echo "========================================"
echo " PROJECT_STATUS.md"
echo "========================================"

cat PROJECT_STATUS.md
