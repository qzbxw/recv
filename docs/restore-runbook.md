# Restore Runbook

This stack uses `restic` for encrypted offsite database backups.

## Prerequisites

- `RESTIC_REPOSITORY` points at the SFTP/offsite repository.
- `RESTIC_PASSWORD` is available to the operator.
- The target Postgres volume is disposable or already snapshotted.

## Restore Drill

1. Stop writers:
   `docker compose stop api blockchain_watcher telegram_bot_worker`
2. List snapshots:
   `docker compose run --rm restic snapshots`
3. Restore the selected dump into a temporary folder:
   `docker compose run --rm restic restore latest --target /restore`
4. Recreate the database volume for a clean drill target:
   `docker compose stop postgres`
5. Start Postgres:
   `docker compose up -d postgres`
6. Load the dump:
   `docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < ./restore/backup/latest.sql`
7. Run API health checks:
   `curl -fsS http://localhost:8080/healthz`
8. Restart workers:
   `docker compose up -d api blockchain_watcher telegram_bot_worker`

## Acceptance

- `/healthz` returns 200.
- `/v1/me` returns 401 or 403 without credentials.
- Admin watcher freshness and reconciliation queues are readable.
