#!/bin/bash
set -e

# Resolve script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the import script
if [ -z "$1" ]; then
  echo "Reading article content from stdin..."
  node "$DIR/frontend-public/scripts/import-articles.mjs"
else
  node "$DIR/frontend-public/scripts/import-articles.mjs" "$1"
fi

# Regenerate database seed migration
echo "Regenerating database seed migration..."
cd "$DIR/frontend-public" && npm run content:generate-blog-seed
