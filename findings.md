# Findings: Production-Readiness Audit

## Phase 1: Infra/CI/edge
- Stack: postgres16 + api/watcher/bot (same Go image, APP_RUNTIME switch) + frontend_public (Next) + frontend (Vite+nginx) + caddy (port 8080→ host proxy/CF in front) + restic (ops profile).
- nginx routes: /api,/v1,/docs → backend (noindex headers); /app/* → Vite SPA static; rest → Next. Short paths (/admin,/checkout...) 308 → /app/*. /docs = backend API docs (swagger), intentionally noindex.
- Caddy: www→apex 308, HSTS/security headers, immutable cache for /_next/static и /media, JSON logs. TLS terminated upstream (Caddy on :80 inside, published 8080).
- Deploy (deploy.yml): SSH to /root/recv, git checkout --force exact SHA, pre-deploy pg_dump + optional restic, build ON the prod server, up -d, health gate (api healthz + caddy robots.txt with real Host) 120s, rollback to previous SHA on failure. `.deploy-sha` marker.
  - Risks: build on prod box (CPU contention, slow rollback ~minutes of rebuild); rollback does NOT roll back DB migrations (pg_dump exists but restore is manual); watcher/bot not in health gate; no blue/green → brief downtime window during container swap.
- CI (ci.yml): backend tests + 90% coverage gate; frontend tests+build; frontend-public lint+unit+build+Playwright e2e; Lighthouse CI with budgets; docker prod-stack smoke incl. caddy validate. Very solid.
- Note: CI .env sets TON_USD_RATE=2.50 → check backend: is TON pricing from a static env rate? Potential prod correctness issue for checkout.
- compose: watcher/bot have no healthchecks; api healthcheck via wget OK. Images named ghcr.io/your-org/recv (placeholder, but builds are local-only so cosmetic).

## Phase 2: frontend-public (SEO/landing)
Strong overall: localized /en|/ru routes, server metadata, per-page canonical+hreflang (x-default=en), per-URL OG cards, JSON-LD (Org/FAQ/BlogPosting/Breadcrumb), split sitemaps with fallback blog entries, editable robots with safe fallback (validated content), llms.txt/llms-full.txt, RSS, Lighthouse CI with budgets (SEO≥0.95 error-gated), Playwright e2e. Home is a server component despite "HomeClient" name.

Issues:
1. **"TON_USDT" leaks into user-facing copy 63×** (both locales): default meta description in layout.tsx:42, home meta description, FAQ answers (→FAQPage schema), plans, compare pages, changelog. Should be "USDT on TON". Also /networks/ton_usdt URL slug with underscore.
2. **Network list inconsistency in copy**: marketing says "TON, TON_USDT, TRON, Base, BSC" (no Solana/Arbitrum) but routes/sitemap include /networks/solana, /networks/arbitrum; architecture doc says watcher monitors TRON/SOLANA/BASE/ARBITRUM (no BSC/TON?). Verify against backend supported networks — possible unsupported claims or orphan network pages.
3. **Backend-down → blog 404**: getPublishedBlogPost returns null on any fetch error/timeout (2s) or non-200 → notFound() → published articles serve hard 404s to crawlers during backend incidents. Should distinguish backend 404 from 5xx/timeout (serve 503).
4. Organization schema in HomeClient hardcodes https://recv.money instead of publicSiteUrl() (cosmetic).
5. publicPageEntries sitemap has no lastModified for static pages (minor).
6. Root / always 308→/en, no Accept-Language for RU users (deliberate? fine for SEO, UX choice).

## Phase 3: frontend (checkout/console)
Checkout page (pages/CheckoutPage.tsx): 5s poll until final status, client countdown, QR with URI fallback, multi payment-options, copy UX, underpaid/overpaid/manual_review states, RU/EN, demo invoice, event tracking. Solid.
Minor: dead `paymentRows` variable (computed, unused); fallbackPaymentURI does Number(payable_amount)*1e9 — NaN if amount string carries asset suffix (demo does "149 USDT" but demo has explicit payment_uri); error message on first-load failure has retry button — good.
API layer: typed errors, 401→refresh-token retry (seller+admin), credentials include. Reasonable.

## Phase 4: backend
Architecture solid: tx-safe CompleteInvoicePayment (row lock, allocations, transitions, outbox+webhook enqueue in one tx), dedup by external_event_id, decimal money, metrics everywhere, 90% coverage gate, EVM confirmation depth 12, Solana finalized commitment, TRON only_confirmed.

Issues:
1. **Native-asset USD rate (TON/SOL/BNB)**: env override (TON_USD_RATE etc.) silently wins over live CoinGecko — if prod .env has TON_USD_RATE (CI template includes it=2.50!), all TON invoices price at a stale fixed rate. Also: no caching of CoinGecko rate — every native invoice creation = live HTTP call to free CoinGecko API (hard rate limits, 10s timeout) → invoice creation fails under burst, no fallback. ENV_MATRIX doesn't document *_USD_RATE at all.
2. **Webhook dispatch lives in telegram bot worker**, single-threaded, sequential: httpClient timeout 35s, claim 20 → one slow seller endpoint stalls all webhook + telegram notifications for minutes. Also bot worker isn't in deploy health gate / has no compose healthcheck. Works without token (delivery-only loop, 10s tick) — good.
3. **Watcher checkpoint filter can drop late-indexed txs**: filters strictly After(LastObservedAt) using blockchain timestamps; an upstream indexer that returns an older tx late (utime < checkpoint) → payment never processed (dedup by tx_hash makes the filter redundant for safety — could use overlap window instead). Missed-payment risk on TON/TRON APIs with indexing lag.
4. Watcher polls all wallets sequentially in one tick (20s interval, 15s HTTP timeout each) — scaling concern with many active wallets.
5. ENV_MATRIX.md stale: documents SMTP_* as required in prod but backend has zero SMTP/email code (auth is Telegram-only); duplicate BASE_RPC_URL row; ETHEREUM_RPC_URL described as "Base RPC endpoint".
6. Default RPC URLs are free public endpoints (llamarpc, mainnet-beta.solana.com, toncenter) — fine for dev, silently rate-limited in prod if env unset (ENV_MATRIX marks them required, but no startup validation that they're set in production).
7. Migrations 026 (seed articles) + 027 (delete them) confirmed dead weight — net no-op pair kept for history; harmless.
8. CI .env template (ci.yml docker job) sets TON_USD_RATE=2.50 — if that template was copied to prod .env, see issue 1.

## Phase 5: mcp-server / AI
AI surface overall: MCP server (stdio, 12 tools incl. agent self-onboarding bootstrap→plan checkout→api key→webhooks), llms.txt + llms-full.txt, /docs/raw/* markdown endpoints, robots allows ClaudeBot/GPTBot/Perplexity etc. Good agent-first story.

MCP server issues:
1. **Broken build/run scripts**: tsconfig has rootDir/outDir commented out → `tsc` compiles in-place into src/ (index.js/.d.ts/.map are committed to git), but `npm start` expects dist/index.js which never exists. `npm run build && npm start` fails.
2. **No distribution**: no `bin` field, not published to npm; public docs (content/docs/en/mcp.mdx) tell users to run `npx -y tsx /path/to/recv/mcp-server/src/index.ts` — requires cloning the repo from an unspecified location. For a marketed product (/products/mcp) this is the weakest link.
3. zod is a dependency but never imported (dead dep); package.json has empty description/keywords/author, license ISC default.
4. No mcp-server job in CI (no typecheck/test/build gate).
5. Tool fetches have no timeout (hung backend = hung agent tool call); response.json() on non-JSON error pages throws generic "Action failed: Unexpected token".
6. list_supported_networks is hardcoded text — will drift from backend support matrix.
7. Committed build artifacts in src/ (index.js, index.d.ts, maps) tracked in git.
