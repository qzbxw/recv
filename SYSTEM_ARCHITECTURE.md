# System Architecture

## Unified System Map

*   **backend:** Go/Gin REST API providing core logic, checkout process, and integration with the database.
*   **watcher:** Blockchain watcher worker that monitors the blockchain networks (TRON, SOLANA, BASE, ARBITRUM) for incoming crypto payments.
*   **bot:** Telegram bot worker for notifications and interactions via Telegram.
*   **frontend (Vite SPA):** React/Vite application under `/app/*` for seller console, checkout, admin, developer portal, and app-local API docs views.
*   **frontend-public (Next public/SEO):** Next.js application for localized marketing, blog, docs, legal pages, robots, sitemap index and child maps, LLM context files, RSS, and canonical metadata.
*   **nginx/gateway:** Reverse proxy mapping URLs to the correct internal service (`frontend`, `frontend-public`, or `api`).
*   **docker compose:** Orchestrates all services, providing different files for development (`docker-compose.dev.yml`) and production (`docker-compose.yml`).
*   **migrations:** Database schema migrations located in `backend/internal/db/migrations`.

## Baseline Commands

*   **backend tests:** `cd backend && go test ./...`
*   **frontend build:** `cd frontend && npm install && npm run build`
*   **frontend-public build:** `cd frontend-public && npm install && npm run build`
*   **canonical local run:** `docker compose -f docker-compose.dev.yml up --build`
*   **production-style compose:** `docker compose up --build`
