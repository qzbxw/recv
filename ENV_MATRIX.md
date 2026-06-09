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
| `TON_USDT_RPC_URL` | TON_USDT RPC endpoint | Required | Required | Required |
| `ETHEREUM_RPC_URL` | Base RPC endpoint | Required | Required | Required |
| `BASE_RPC_URL` | Base RPC endpoint | Required | Required | Required |
| `BASE_RPC_URL` | Base RPC endpoint | Required | Required | Required |
| `BSC_RPC_URL` | Binance Smart Chain RPC endpoint | Required | Required | Required |
| **Telegram Bot** |
| `TELEGRAM_BOT_TOKEN` | Token for the Telegram worker | Optional/Mocked | Required | Required |
| `TELEGRAM_INIT_MAX_AGE_SECONDS` | WebApp initialization max age | Optional (86400)| Required | Required |
| **Admin** |
| `ADMIN_USERNAME` | Administrator username | Required | Required | Required |
| `ADMIN_PASSWORD` | Administrator password | Required | Required | Required |
| `ADMIN_JWT_SECRET` | Secret for admin sessions | Dev secret | Strong secret | Strong secret |
| **SMTP / Email** |
| `SMTP_HOST` | SMTP server host | Optional/Mocked | Required | Required |
| `SMTP_PORT` | SMTP server port | Optional/Mocked | Required | Required |
| `SMTP_USERNAME` | SMTP username | Optional/Mocked | Required | Required |
| `SMTP_PASSWORD` | SMTP password | Optional/Mocked | Required | Required |
| `SMTP_FROM_EMAIL` | Sender email address | Optional/Mocked | Required | Required |
| **Frontend** |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin used by Next metadata routes (`robots.ts`, `sitemap.ts`, canonical metadata). Do not include a path. | `http://localhost:3000` | Staging origin | `https://recv.money` |
| `NEXT_PUBLIC_API_URL` | Public origin used by Next server components to call API routes. Code appends `/api/...`; do not include `/api`. | `http://localhost:3000` | Staging origin | `https://recv.money` |
| `VITE_API_BASE_URL` | Public origin used by Vite app API client. Code appends `/api/...` and `/v1/...`; do not include `/api`. | `http://localhost:3000` | Staging origin | `https://recv.money` |

## Production CD secrets

The `CD` GitHub Actions workflow deploys every push to `main` independently of
the CI workflow. Configure these repository-level Actions secrets:

| Secret | Description |
| :--- | :--- |
| `DEPLOY_HOST` | Production server hostname or IP. |
| `DEPLOY_USER` | SSH user allowed to run Docker Compose. |
| `DEPLOY_SSH_KEY` | Private SSH key for the deployment user. |

The server checkout is `/root/recv`; it must contain the Git repository and the
production `.env`. Images are built on the server from the exact pushed commit,
so no registry credentials are required.
