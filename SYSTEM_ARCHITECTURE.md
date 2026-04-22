# System Architecture

## Unified System Map

*   **backend:** Go/Gin REST API providing core logic, checkout process, and integration with the database.
*   **watcher:** Blockchain watcher worker that monitors the blockchain networks (TRON, SOLANA, BASE, ARBITRUM) for incoming crypto payments.
*   **bot:** Telegram bot worker for notifications and interactions via Telegram.
*   **frontend (Vite SPA):** React/Vite application strictly for administrative and seller dashboard functionality (the "cabinet").
*   **frontend-public (Next public/SEO):** Next.js application for public-facing pages, landing pages, legal/privacy/terms, etc., optimized for SEO.
*   **nginx/gateway:** Reverse proxy mapping URLs to the correct internal service (`frontend`, `frontend-public`, or `api`).
*   **docker compose:** Orchestrates all services, providing different files for development (`docker-compose.dev.yml`) and production (`docker-compose.yml`).
*   **migrations:** Database schema migrations located in `backend/internal/db/migrations`.

## Baseline Commands

*   **backend tests:** `cd backend && go test ./...`
*   **frontend build:** `cd frontend && npm install && npm run build`
*   **frontend-public build:** `cd frontend-public && npm install && npm run build`
*   **docker compose up/build:** `docker compose up --build` (or `docker compose -f docker-compose.dev.yml up --build` for dev)
