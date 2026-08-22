#!/bin/sh
set -eu

echo "=========================================="
echo " SentinelAI API"
echo "=========================================="

echo "[1/2] Waiting for PostgreSQL..."

python - <<'PY'
import os
import time

from sqlalchemy import create_engine, text

url = os.environ["DATABASE_URL"]
engine = create_engine(url, pool_pre_ping=True)

for attempt in range(30):
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("PostgreSQL is ready.")
        break
    except Exception as exc:
        print(
            f"PostgreSQL not ready "
            f"(attempt {attempt + 1}/30): {exc}"
        )
        time.sleep(2)
else:
    raise SystemExit("PostgreSQL did not become ready.")

PY

echo "[2/2] Running Alembic migrations..."
alembic -c /app/api/alembic.ini upgrade head

echo "Starting FastAPI..."
exec uvicorn api.app.main:app \
    --host 0.0.0.0 \
    --port 8000
