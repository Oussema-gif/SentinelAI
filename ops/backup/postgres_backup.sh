#!/usr/bin/env bash
set -euo pipefail

# SentinelAI PostgreSQL backup script
# Usage:
#   ./postgres_backup.sh
#
# Environment (or .env.local):
#   POSTGRES_USER
#   POSTGRES_PASSWORD
#   POSTGRES_DB
#   BACKUP_DIR         (default: ./backups)
#   BACKUP_RETENTION_DAYS (default: 7)

POSTGRES_USER="${POSTGRES_USER:?POSTGRES_USER is required}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
POSTGRES_DB="${POSTGRES_DB:?POSTGRES_DB is required}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

export PGPASSWORD="$POSTGRES_PASSWORD"

pg_dump \
  -h postgres \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --format=plain \
  --no-owner \
  --no-privileges \
  | gzip > "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"

# Retention: remove old backups
find "$BACKUP_DIR" \
  -maxdepth 1 \
  -name "${POSTGRES_DB}_*.sql.gz" \
  -type f \
  -mtime +"$BACKUP_RETENTION_DAYS" \
  -delete

echo "Retention policy applied: kept last ${BACKUP_RETENTION_DAYS} days"
