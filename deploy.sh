#!/bin/bash
set -e

# Configuration
SERVER="${DEPLOY_SERVER:-user@your_vps_ip}"
PROJECT_DIR="${DEPLOY_DIR:-/path/to/project}"
BRANCH="${DEPLOY_BRANCH:-main}"

echo "🚀 Starting deploy to $SERVER at $PROJECT_DIR..."

ssh -T "$SERVER" bash -s -- "$PROJECT_DIR" "$BRANCH" << 'SSH_EOF'
set -e

# Arguments passed from local shell
PROJECT_DIR="$1"
BRANCH="$2"

echo "📂 Changing to project directory $PROJECT_DIR..."
cd "$PROJECT_DIR" || { echo "❌ Cannot cd to $PROJECT_DIR"; exit 1; }

echo "📦 Fetching latest changes..."
git fetch origin

# Save current commit for possible rollback
PREV_COMMIT=$(git rev-parse HEAD)
echo "Current commit: $PREV_COMMIT"

echo "🔄 Updating code to origin/$BRANCH..."
git reset --hard "origin/$BRANCH"

rollback() {
    echo "❌ Deployment failed! Rolling back to $PREV_COMMIT..."
    git reset --hard "$PREV_COMMIT"
    echo "🔨 Rebuilding previous images..."
    docker compose build || true
    echo "🚀 Restarting previous containers..."
    docker compose up -d
    echo "⏪ Rollback complete."
    exit 1
}

echo "🔨 Building new images..."
if ! docker compose build; then
    rollback
fi

echo "🚀 Starting containers with new build..."
if ! docker compose up -d; then
    rollback
fi

echo "⏳ Waiting for healthchecks to pass..."
TIMEOUT=60
ELAPSED=0

while true; do
    # Check if any container exited
    FAILED_CONTAINERS=$(docker compose ps --status exited -q)
    if [ -n "$FAILED_CONTAINERS" ]; then
        echo "❌ Some containers exited unexpectedly."
        rollback
    fi

    # Check health status
    # Get all container IDs for this project
    CONTAINERS=$(docker compose ps -q)

    if [ -z "$CONTAINERS" ]; then
        echo "❌ No containers found."
        rollback
    fi

    ALL_HEALTHY=true
    for CONTAINER in $CONTAINERS; do
        HEALTH_STATUS=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER")

        if [ "$HEALTH_STATUS" = "unhealthy" ]; then
            echo "❌ Container $CONTAINER is unhealthy."
            rollback
        elif [ "$HEALTH_STATUS" = "starting" ]; then
            ALL_HEALTHY=false
        fi
        # "none" or "healthy" are considered ok for this iteration
    done

    if $ALL_HEALTHY; then
        echo "✅ All services are healthy and running!"
        break
    fi

    if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
        echo "❌ Timeout waiting for services to become healthy ($TIMEOUT seconds)."
        rollback
    fi

    sleep 5
    ELAPSED=$((ELAPSED + 5))
    echo "⏳ Waiting... ($ELAPSED seconds elapsed)"
done

echo "🎉 Deploy finished successfully!"
SSH_EOF

echo "✅ Deploy script execution completed."
