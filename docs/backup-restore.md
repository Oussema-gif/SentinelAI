# SentinelAI Backup & Restore

## Overview

- PostgreSQL data is persisted in the `sentinelai_sentinelai-postgres-data` volume.
- Logical backups (SQL dumps) are stored in the `sentinelai_sentinelai-backups` volume.
- Backups are compressed (`*.sql.gz`) and named with timestamps.

## Environment

All backup/restore commands assume you are running from the project root with the standard Compose stack up.

## Create a backup

```bash
podman-compose \
  -f compose.yaml \
  -f compose.backup.yaml \
  run --rm backup
```

Backups are stored in the `sentinelai_sentinelai-backups` volume.

## List available backups

```bash
podman run --rm \
  -v sentinelai_sentinelai-backups:/backups \
  alpine ls -lh /backups
```

## Restore from a backup

```bash
./ops/backup/restore.sh sentinelai_YYYYMMDD_HHMMSS.sql.gz
```

Example:

```bash
./ops/backup/restore.sh sentinelai_20260822_001545.sql.gz
```

> **Warning:** Restore overwrites existing data. Ensure you have a recent backup before restoring.

## Retention policy

- Default retention: 7 days.
- Configured in `images/backup/entrypoint.sh`.
- The backup script automatically deletes backups older than the retention window.

## Manual volume backup (optional)

For full-volume snapshots (e.g., host-level backup jobs):

```bash
podman run --rm \
  -v sentinelai_sentinelai-postgres-data:/var/lib/postgresql/data:ro \
  -v ./backups/volumes:/output \
  alpine tar -czf /output/postgres-data-$(date +%Y%m%d_%H%M%S).tar.gz \
  -C /var/lib/postgresql/data .
```

Store `/output` according to your infrastructure backup policy.
