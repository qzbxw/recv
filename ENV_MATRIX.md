# Environment Variable Matrix

The required environment variables vary based on the deployment environment: `dev`, `staging`, and `prod`.

| Variable | Description | `dev` | `staging` | `prod` |
| :--- | :--- | :--- | :--- | :--- |
| **App Configuration** |
| `APP_ENV` | Application environment (`development`, `staging`, `production`) | `development` | `staging` | `production` |
| `HTTP_PORT` | Port for the API | Optional (8080) | Required | Required |
| `MEDIA_DIR` | Directory for CMS media uploads (Docker volume in compose) | Optional (`./data/media`) | `/data/media` | `/data/media` |
| `JWT_SECRET` | Secret for user sessions | Dev secret | Strong secret | Strong secret |
| `INTERNAL_TOKEN` | Token for internal service communication | Dev token | Strong token | Strong token |
| `ALLOW_INSECURE_DEV_AUTH` | Allows bypassing standard auth for dev | `true` | `false` | `false` |
| `PUBLIC_APP_URL` | Public origin for generated app links, checkout links, bot URLs, and webhook-facing payload URLs. Do not include `/app` or `/api`. | `http://localhost:3000` | Staging origin | `https://recv.money` |
| **Database** |
| `DATABASE_URL` | Full connection string to PostgreSQL | Required | Required | Required |
| `POSTGRES_DB` | Database name | Required | Required | Required |
| `POSTGRES_USER` | Database user | Required | Required | Required |
| `POSTGRES_PASSWORD` | Database password | Required | Required | Required |
| `POSTGRES_HOST` | Database host | `postgres` | Required | Required |
| `POSTGRES_PORT` | Database port | `5432` | Required | Required |
| **Blockchain RPCs & APIs** |
| `TRONGRID_BASE_URL` | Base URL for Tron API | Required | Required | Required |
| `TRONGRID_API_KEY` | Tron API Key | Optional | Required | Required |
| `TONCENTER_BASE_URL` | Base URL for TON API | Required | Required | Required |
| `TONCENTER_API_KEY` | TON API Key | Optional | Required | Required |
| `TON_USDT_MASTER_ADDRESS` | USDT jetton master address on TON | Optional (mainnet default) | Required | Required |
| `ETHEREUM_RPC_URL` | Ethereum RPC endpoint | Required | Required | Required |
| `BASE_RPC_URL` | Base RPC endpoint | Required | Required | Required |
| `ARBITRUM_RPC_URL` | Arbitrum RPC endpoint | Required | Required | Required |
| `SOLANA_RPC_URL` | Solana RPC endpoint | Required | Required | Required |
| `BSC_RPC_URL` | Binance Smart Chain RPC endpoint | Required | Required | Required |
| `TON_USD_RATE` | Static TON/USD rate override for dev/test pricing. **Forbidden in production** (config refuses to boot); live rates come from CoinGecko with a short cache. | Optional | Forbidden | Forbidden |
| `SOL_USD_RATE` | Static SOL/USD rate override (dev/test only, same rules as `TON_USD_RATE`) | Optional | Forbidden | Forbidden |
| `BNB_USD_RATE` | Static BNB/USD rate override (dev/test only, same rules as `TON_USD_RATE`) | Optional | Forbidden | Forbidden |
| **Telegram Bot** |
| `TELEGRAM_BOT_TOKEN` | Token for the Telegram worker | Optional/Mocked | Required | Required |
| `TELEGRAM_INIT_MAX_AGE_SECONDS` | WebApp initialization max age | Optional (86400)| Required | Required |
| **Admin** |
| `ADMIN_USERNAME` | Administrator username (dev-only; config refuses it in production) | Optional | Forbidden | Forbidden |
| `ADMIN_PASSWORD` | Administrator password (dev-only; config refuses it in production) | Optional | Forbidden | Forbidden |
| `ADMIN_BOOTSTRAP_EMAIL` | Bootstrap admin account email (production admin login) | Optional | Required | Required |
| `ADMIN_BOOTSTRAP_PASSWORD` | Bootstrap admin account password | Optional | Required | Required |
| `ADMIN_JWT_SECRET` | Secret for admin sessions (must differ from `JWT_SECRET` in production) | Dev secret | Strong secret | Strong secret |
| **Frontend** |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin used by Next metadata routes (`robots.ts`, `sitemap.ts`, canonical metadata). Do not include a path. | `http://localhost:3000` | Staging origin | `https://recv.money` |
| `NEXT_PUBLIC_API_URL` | Public origin used by Next server components to call API routes. Code appends `/api/...`; do not include `/api`. | `http://localhost:3000` | Staging origin | `https://recv.money` |
| `VITE_API_BASE_URL` | Public origin used by Vite app API client. Code appends `/api/...` and `/v1/...`; do not include `/api`. | `http://localhost:3000` | Staging origin | `https://recv.money` |

## Production CD secrets and variables

The `CD` GitHub Actions workflow deploys every push to `main` independently of
the CI workflow. Images are built in CI, pushed to GHCR
(`ghcr.io/<owner>/recv/{api,frontend-public,frontend}` tagged with the commit
SHA and `latest`), and the server only pulls them. The deploy logs into GHCR
with the workflow-scoped `GITHUB_TOKEN`, so no long-lived registry credential
is stored on the server. Building on the server remains a fallback if a pull
fails.

Repository-level Actions **secrets**:

| Secret | Description |
| :--- | :--- |
| `DEPLOY_HOST` | Production server hostname or IP. |
| `DEPLOY_USER` | SSH user allowed to run Docker Compose. |
| `DEPLOY_SSH_KEY` | Private SSH key for the deployment user. |
| `NPM_TOKEN` | npm automation token for publishing `recv-mcp` (release-mcp workflow only). |

Repository-level Actions **variables** (baked into frontend images at build
time; all optional — defaults assume `https://recv.money` and no analytics):

| Variable | Description |
| :--- | :--- |
| `PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_API_URL` / `VITE_API_BASE_URL` | Public origins (default `https://recv.money`). |
| `GTM_ID` / `YANDEX_METRIKA_ID` | Analytics IDs; empty disables the scripts. |
| `GOOGLE_SITE_VERIFICATION` / `YANDEX_VERIFICATION` | Search console verification meta tags. |

The server checkout is `/root/recv`; it must contain the Git repository and the
production `.env`. The deploy writes `GHCR_IMAGE_PREFIX` and `GHCR_IMAGE_TAG`
into that `.env` so a manual `docker compose up -d` on the server reuses the
deployed images instead of the compose placeholder defaults.
