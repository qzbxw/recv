#!/bin/bash
set -euo pipefail

# This script is meant to be run manually on the VPS server to deploy the latest changes
# directly, without relying on GitHub Actions.

echo "Starting deployment..."

# Go to the repository directory (assuming it's in ~/recv or similar; adjust this if needed)
REPO_DIR="/root/recv"
cd "$REPO_DIR"

echo "Fetching latest changes from origin/main..."
git fetch origin main
git reset --hard origin/main

# Persist the deployment commit sha into .env
DEPLOY_SHA="$(git rev-parse HEAD)"
echo "Deploying commit $DEPLOY_SHA..."

update_env_var() {
  if grep -q "^${1}=" .env; then
    sed -i "s|^${1}=.*|${1}=${2}|" .env
  else
    printf '%s=%s\n' "$1" "$2" >> .env
  fi
}

update_env_var GHCR_IMAGE_TAG "$DEPLOY_SHA"

# Variables for frontend builds are extracted from the server's .env file.
export PUBLIC_APP_URL=$(grep -E '^PUBLIC_APP_URL=' .env | cut -d= -f2- | tr -d '"'\'' ' || echo 'https://recv.money')
export NEXT_PUBLIC_SITE_URL=$(grep -E '^NEXT_PUBLIC_SITE_URL=' .env | cut -d= -f2- | tr -d '"'\'' ' || echo 'https://recv.money')
export NEXT_PUBLIC_API_URL=$(grep -E '^NEXT_PUBLIC_API_URL=' .env | cut -d= -f2- | tr -d '"'\'' ' || echo 'https://recv.money')
export GTM_ID=$(grep -E '^GTM_ID=' .env | cut -d= -f2- | tr -d '"'\'' ' || echo '')
export YANDEX_METRIKA_ID=$(grep -E '^YANDEX_METRIKA_ID=' .env | cut -d= -f2- | tr -d '"'\'' ' || echo '')
export GOOGLE_SITE_VERIFICATION=$(grep -E '^GOOGLE_SITE_VERIFICATION=' .env | cut -d= -f2- | tr -d '"'\'' ' || echo '')
export YANDEX_VERIFICATION=$(grep -E '^YANDEX_VERIFICATION=' .env | cut -d= -f2- | tr -d '"'\'' ' || echo '')
export VITE_API_BASE_URL=$(grep -E '^VITE_API_BASE_URL=' .env | cut -d= -f2- | tr -d '"'\'' ' || echo 'https://recv.money')

echo "Building images locally on VPS..."
docker compose build \
  --build-arg PUBLIC_APP_URL="$PUBLIC_APP_URL" \
  --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
  --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
  --build-arg GTM_ID="$GTM_ID" \
  --build-arg YANDEX_METRIKA_ID="$YANDEX_METRIKA_ID" \
  --build-arg GOOGLE_SITE_VERIFICATION="$GOOGLE_SITE_VERIFICATION" \
  --build-arg YANDEX_VERIFICATION="$YANDEX_VERIFICATION" \
  --build-arg VITE_API_BASE_URL="$VITE_API_BASE_URL" \
  api blockchain_watcher telegram_bot_worker frontend_public frontend

echo "Starting Postgres..."
docker compose up -d postgres

echo "Starting all services..."
docker compose up -d --remove-orphans \
  api blockchain_watcher telegram_bot_worker frontend_public frontend caddy

echo "Pruning old images..."
docker image prune -f --filter "until=168h"

echo "Deployment completed successfully! Commit: $DEPLOY_SHA"
