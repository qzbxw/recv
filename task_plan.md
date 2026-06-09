# Task Plan: Comprehensive recv SEO Update

## Goal
Bring the bilingual EN/RU public site, private SPA, backend CMS, and edge configuration closer to the supplied SEO requirements. Canonical origin is `https://recv.money`; public URLs have no trailing slash; existing product claims must remain unchanged.

## Current Phase
Phases 1-3 complete; Phases 4-5 partially complete

## Phases

### Phase 1: Audit and requirements mapping
- [x] Inspect repository architecture and current git state.
- [x] Identify existing SEO, sitemap, blog translation, and schema work.
- [x] Map routing, metadata, CMS models, migrations, and tests.
- **Status:** complete

### Phase 2: Technical SEO and edge behavior
- [x] Server-only metadata and correct source HTML language.
- [x] Canonical host/path redirects, private-surface noindex, cache headers, and structured 404 logging.
- [x] Locale/type sitemap indexes with translation-aware hreflang and indexability filtering.
- [x] Safe editable robots.
- [x] Admin-managed redirect table and public cached redirect resolver.
- **Status:** complete

### Phase 3: CMS, structured content, media, and APIs
- [x] Add migrations/models/API fields for structured content, SEO controls, authors, and robots settings.
- [x] Validate publish requirements and structured article content.
- [x] Media CMS backend: migration 025, content-addressed storage on a Docker volume, admin upload/list/alt/delete API with MIME sniffing, extension agreement, 10 MiB/40 MP limits, EXIF orientation fix, downscale to 2400 px, delete-only-if-unused; public /media serving with immutable cache; cover dimensions in public blog API; next/image cover rendering; tests incl. MIME spoofing/oversize/bomb.
- [x] Admin SPA media library UI: modal with upload (alt required), select, delete; wired into cover field and TipTap image insertion.
- [x] TipTap WYSIWYG (lazy chunk): H2/H3, lists, tables, quotes, code, callout/FAQ/CTA custom nodes, media-library images, lazy YouTube, internal-link suggestions, Word/AI paste cleanup; legacy Markdown stays until explicit convert + first save (content_version 2).
- [x] Backend structured-content sanitization: node/mark whitelists, link protocols, image src policy, publish-time image alt, YouTube embed pattern; tests.
- [x] Public structured renderer: TOC from headings, fully-visible FAQ + FAQPage schema, callouts, CTA cards, tables, lightbox images via next/image (dimensions injected by API), click-to-load YouTube.
- **Status:** complete

### Phase 4: Content, schema, UI, and performance
- [x] Complete visible breadcrumbs and matching BreadcrumbList schema across hubs, products, networks, use cases, comparisons, articles, docs, and the team page; enforce FAQ/BlogPosting/schema rules in the sitemap crawler.
- [x] Correct article author/publisher schema and author presentation.
- [x] Generate per-URL 1200x630 OG/Twitter assets: localized static cards, article routes using cover images with branded fallback, absolute metadata URLs, and runtime asset validation in the sitemap audit.
- [x] Add optional analytics and verification with zero scripts when unset.
- [x] Remove remote font downloads and lazy-load the admin editor.
- [x] Self-host Manrope/Montserrat as subset latin+cyrillic variable woff2 via next/font/local.
- [x] Convert all static marketing pages to Server Components with client islands (MarketingInteractions, FaqAccordion, Header); home JS 912→207 KB gzip.
- [x] SSR-reveal hero sections (LCP 3.8s→2.7s mobile-throttled); robots.txt Lighthouse-valid; a11y 1.0.
- [x] Add Lighthouse CI job + budgets (lighthouserc.json, ci.yml).
- [x] Add first-party Web Vitals storage/dashboard.
- [x] Finish CMS image optimization: article and blog-hub `/media/` covers render through next/image with stable dimensions/containers; legacy external URLs retain a compatibility fallback.
- [x] Add eight bilingual article pairs without unsupported claims: USDT website payments, non-custodial gateways, TRC20 API, TON/Telegram, webhook signatures, custodial vs direct-to-wallet, multi-chain invoices, and late/under/overpayments.
- **Status:** partially complete

### Phase 5: Verification
- [x] Add static HTML/SEO audits and focused backend tests.
- [x] Run frontend builds/tests, backend tests, and local HTTP smoke checks available locally.
- [x] Add Playwright coverage for breadcrumbs, localized search, language switching, bilingual articles, real 404s, and noindex service surfaces; optional CMS structured-article coverage exercises TOC and lightbox.
- [x] Record deployment-only follow-up checks separately in `docs/SEO_DEPLOYMENT_CHECKLIST.md`.
- **Status:** partially complete

## Decisions
| Decision | Rationale |
|---|---|
| Preserve current product claims | Explicit requirement; no unsupported metrics will be introduced. |
| Prefer existing Next.js metadata and Go store patterns | Limits scope and matches repository ownership boundaries. |
| Treat deployment submissions and 28-day CWV monitoring as operational follow-up | They cannot be completed solely in a local repository change. |

## Errors Encountered
| Error | Attempt | Resolution |
|---|---:|---|
| `caddy validate` failed when `CADDY_EMAIL` was unset because the global `email` directive had no argument | 1 | Removed the optional directive and added containerized Caddy validation to CI. |
| Go package tests could not bind an ephemeral localhost port inside the sandbox | 1 | Re-run the same test command with the required sandbox escalation. |
| Blog INSERT target/placeholder counts were mismatched after adding SEO columns | 1-2 | Counted the 28 target columns explicitly and corrected placeholders; backend suite passed afterward. |
| Next Turbopack build could not bind an internal localhost port in the sandbox | 1 | Re-run production build with sandbox escalation. |
| Runtime route conflict between `/sitemaps/[file]` and `/sitemaps/[locale]/[file]` caused 500 responses | 1 | Moved the legacy redirect handler to `/sitemaps/[locale]/route.ts`, sharing the same dynamic segment name. |
| Stale generated TypeScript validator under `tmp/recv-next-build` referenced the removed route | 1 | Excluded generated `tmp` and permission-blocked Next directories from TypeScript source discovery. |
| SEO audit initially treated public `/products/api` URLs as private `/api` routes | 1 | Anchored the private-path expression to the URL root. |
| Targeted Go tests still execute the package `TestMain`, which cannot bind an ephemeral localhost port in the sandbox | 2 | Verified package compilation with `go test -c`; full runtime suite had already passed before the latest isolated additions. |
| Turbopack production build cannot bind its internal CSS worker port in the restricted sandbox | 2 | Re-ran with local-port permission; the final production build passed. |
| Production smoke CI omitted Caddy and tested port 3000 although production publishes Caddy on 8080 | 1 | Start `caddy` in the smoke stack and run all route checks through port 8080. |
