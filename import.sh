#!/bin/bash
# Import neural-net generated articles straight into the live database as
# admin-editable drafts. Usage:
#   ./import.sh article.txt
#   cat article.txt | ./import.sh
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SQL_FILE="$(mktemp /tmp/recv-import-XXXXXX.sql)"

# Parse the raw article text into upsert SQL
if [ $# -ge 1 ]; then
  node "$DIR/frontend-public/scripts/import-articles.mjs" "$1" --sql "$SQL_FILE"
else
  echo "Reading article content from stdin..."
  node "$DIR/frontend-public/scripts/import-articles.mjs" --sql "$SQL_FILE"
fi

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$DIR/docker-compose.yml" "$@"
  else
    docker-compose -f "$DIR/docker-compose.yml" "$@"
  fi
}

# Apply the SQL to whichever database is reachable
if command -v docker >/dev/null 2>&1 && [ -n "$(compose ps -q postgres 2>/dev/null)" ]; then
  echo "Applying to postgres via docker compose..."
  compose exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-recv}" -d "${POSTGRES_DB:-recv}"' < "$SQL_FILE"
elif command -v psql >/dev/null 2>&1 && [ -n "${DATABASE_URL:-}" ]; then
  echo "Applying via psql + DATABASE_URL..."
  psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f "$SQL_FILE"
else
  cp "$SQL_FILE" "$DIR/import-articles.sql"
  rm -f "$SQL_FILE"
  echo "No running postgres found. SQL saved to $DIR/import-articles.sql"
  echo "Apply it manually, e.g.:"
  echo "  docker compose exec -T postgres psql -U recv -d recv < import-articles.sql"
  exit 1
fi

rm -f "$SQL_FILE"
echo ""
echo "Done! The articles are now drafts in the admin panel (Blog section)."
echo "Open the admin, review/edit them, and hit Publish when ready."
echo "Re-running the import updates drafts but never touches published posts."
