#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <backup-file-name>" >&2
  echo "Example: $0 sentinelai_20260822_001545.sql.gz" >&2
  exit 1
fi

BACKUP_FILE="$1"
VOLUME="sentinelai_sentinelai-backups"

if ! podman run --rm -v "$VOLUME":/backups alpine test -f "/backups/$BACKUP_FILE"; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
NEW_DB="sentinelai_restore_${TIMESTAMP}"

echo "Restoring $BACKUP_FILE into temporary database $NEW_DB..."

podman run --rm \
  -v "$VOLUME":/backups:ro \
  --network sentinelai_sentinelai \
  -e PGPASSWORD=sentinelai_dev \
  -e NEW_DB="$NEW_DB" \
  -e BACKUP_FILE="$BACKUP_FILE" \
  postgres:16-alpine sh -c '
    set -eu
    apk add --no-cache gzip

    # Create new database
    psql -h postgres -U sentinelai -d postgres -qtAXc "CREATE DATABASE \"$NEW_DB\";"

    # Restore into new database
    gunzip -c "/backups/$BACKUP_FILE" | \
      psql -h postgres -U sentinelai -d "$NEW_DB" \
      --set ON_ERROR_STOP=on

    # Terminate other connections to sentinelai
    psql -h postgres -U sentinelai -d postgres -qtAXc "
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '\''sentinelai'\''
        AND pid <> pg_backend_pid();
    "

    # Drop old database
    psql -h postgres -U sentinelai -d postgres -qtAXc "DROP DATABASE IF EXISTS sentinelai;"

    # Rename new database to sentinelai
    psql -h postgres -U sentinelai -d postgres -qtAXc "ALTER DATABASE \"$NEW_DB\" RENAME TO sentinelai;"
  '

echo "Restore completed. Database '\''sentinelai'\'' has been replaced."
