#!/usr/bin/env sh
set -eu

BACKUP_DIR="/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/sentinelai_${TIMESTAMP}.sql.gz"

pg_dump \
  -h postgres \
  -U "${POSTGRES_USER:-sentinelai}" \
  -d "${POSTGRES_DB:-sentinelai}" \
  --format=plain \
  --no-owner \
  --no-privileges \
  | gzip > "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"

find "$BACKUP_DIR" \
  -maxdepth 1 \
  -name 'sentinelai_*.sql.gz' \
  -type f \
  -mtime +7 \
  -delete

echo "Retention policy applied: kept last 7 days"
