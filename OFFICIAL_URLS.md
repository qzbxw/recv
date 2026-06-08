# Official Routing Contour

## Domains

* **Production:** `https://recv.money`
* **Local canonical entrypoint:** `http://localhost:3000` through `docker-compose.dev.yml` and the nginx gateway.

## Route Ownership

* `/`, `/en`, `/ru`, `/en/dev`, `/ru/dev`, `/en/business`, `/ru/business`, `/en/privacy`, `/ru/privacy`, `/en/terms`, `/ru/terms`, `/en/blog`, `/ru/blog` -> `frontend-public` (Next.js).
* `/robots.txt`, `/sitemap.xml`, `/sitemaps/*.xml`, `/llms.txt`, `/llms-full.txt`, localized RSS feeds, favicon and Next assets -> `frontend-public`.
* `/app/*` -> `frontend` (Vite SPA). This includes `/app/auth`, `/app/console`, `/app/admin`, `/app/admin/blog`, `/app/developers`, `/app/developer-portal`, and `/app/checkout/:id`.
* `/api/*` and `/v1/*` -> `api` (Go/Gin).
* `/docs/*` -> `api` generated API docs.

## Redirects

The gateway redirects legacy short app paths to the canonical app namespace:

* `/auth` -> `/app/auth`
* `/console` -> `/app/console`
* `/admin` -> `/app/admin`
* `/developers` -> `/app/developers`
* `/developer-portal` -> `/app/developer-portal`
* `/checkout/:id` -> `/app/checkout/:id`

Checkout links emitted by the app, API, and bot must use `/app/checkout/:id`.
