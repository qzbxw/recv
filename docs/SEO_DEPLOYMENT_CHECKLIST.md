# SEO Deployment Checklist

Use this checklist for staging and production releases. Repository checks should pass before any external submission.

## Before deploy

- Run `docker compose -f docker-compose.yml config --quiet`.
- Run `docker run --rm -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2.8-alpine caddy validate --config /etc/caddy/Caddyfile`.
- Run backend tests: `cd backend && go test ./...`.
- Run public checks: `cd frontend-public && npm test && npx tsc --noEmit && npm run build && npm run test:e2e`.
- Confirm migrations `022` through `026` are included in the API image.
- Back up PostgreSQL and the persistent media volume.

## Deploy

- Deploy PostgreSQL, API, public frontend, private frontend, and Caddy from the same release.
- Confirm migrations `022_blog_structured_seo` through `026_seed_bilingual_articles` completed.
- Confirm `/healthz`, `/en`, `/ru`, `/app/`, and `/docs/` respond through the public origin.
- Confirm HTTP and `www` redirect to `https://recv.money` with 308.
- Confirm trailing slashes, `index.html`, `/docs`, and locale-less public URLs redirect with 308.
- Confirm `/app`, `/api`, `/v1`, and `/docs` return `X-Robots-Tag: noindex, nofollow, noarchive`.
- Confirm HTTP/2, HTTP/3, zstd/gzip, and immutable caching for `/_next/static/`, `/_next/image`, and `/media/`.

## SEO verification

- Run `SEO_AUDIT_BASE_URL=https://recv.money npm run audit:seo` from `frontend-public/`.
- Verify every sitemap URL returns 200 and has one title, H1, canonical, valid locale, and reciprocal hreflang.
- Verify `/sitemap.xml`, `/sitemaps/en`, and `/sitemaps/ru`; ensure private/API/Swagger URLs are absent.
- Test representative pages in Google Rich Results Test and Schema.org Validator.
- Verify all `og:image` and `twitter:image` URLs are absolute, reachable, and 1200x630.
- Submit the EN/RU sitemap index in Google Search Console and Yandex Webmaster after the production audit passes.

## 28-day monitoring

- Track p75 LCP, INP, and CLS by route family and device class.
- Targets: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1.
- Investigate regressions by release, route template, and browser before changing global thresholds.
- Record the first complete 28-day window and remediation decisions in `progress.md`.
