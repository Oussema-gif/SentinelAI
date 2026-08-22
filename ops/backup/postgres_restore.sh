#!/usr/bin/env bash
set -euo pipefail

# SentinelAI PostgreSQL restore script
# Usage:
#   ./postgres_restore.sh <backup-file.sql.gz>
#
# Environment (or .env.local):
#   POSTGRES_USER
#   POSTGRES_PASSWORD
#   POSTGRES_DB

if [ $# -ne 1 ]; then
  echo "Usage: $0 <backup-file.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

POSTGRES_USER="${POSTGRES_USER:?POSTGRES_USER is required}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
POSTGRES_DB="${POSTGRES_DB:?POSTGRES_DB is required}"

export PGPASSWORD="$POSTGRES_PASSWORD"

echo "Restoring $BACKUP_FILE into database $POSTGRES_DB..."

gunzip -c "$BACKUP_FILE" | \
  psql -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --set ON_ERROR_STOP=on

echo "Restore completed."
