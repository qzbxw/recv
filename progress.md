# Progress: Production-Readiness Audit and Fixes

## Session 2026-06-12: audit fixes (critical + important findings)

### Backend
- Native USD rates (TON/SOL/BNB): added 2-minute in-memory cache and 30-minute bounded stale fallback around the CoinGecko fetch; added regression tests for fresh-cache reuse, stale fallback, and stale-bound expiry.
- config.Load now refuses TON_USD_RATE / SOL_USD_RATE / BNB_USD_RATE in APP_ENV=production (static rate overrides are dev/test-only); removed TON_USD_RATE from the CI production .env template; added config test.
- Watcher checkpoint filter now re-scans a 15-minute overlap window behind the checkpoint so late-indexed transactions are not dropped (dedup by external event id absorbs repeats); updated the checkpoint test.
- Webhook deliveries moved to their own 5-second loop inside the bot worker (independent of Telegram long-polling), delivered concurrently per claimed batch, with a dedicated 15s HTTP client (35s Telegram client untouched; tests construct workers without the new client and fall back).

### Infra
- docker-compose: healthchecks for blockchain_watcher and telegram_bot_worker via metrics /healthz (9091/9092).
- deploy.yml health gate now also requires watcher and bot /healthz; failure diagnostics include their logs.
- ENV_MATRIX.md: removed nonexistent SMTP section; fixed duplicate BASE_RPC_URL and wrong ETHEREUM_RPC_URL description; added ARBITRUM/SOLANA RPC and TON_USDT_MASTER_ADDRESS rows; documented *_USD_RATE as forbidden in prod; corrected ADMIN_* rows to match config validation.

### frontend-public
- Blog article route now distinguishes backend 404 (real notFound) from backend outage/timeout (throws -> error boundary -> 5xx), so crawlers never see hard 404s on published articles during incidents. lookupPublishedBlogPost returns ok/not_found/unavailable; getPublishedBlogPost kept as wrapper for the OG route.
- Removed all 63 user-facing "TON_USDT" leaks in EN/RU copy (layout/home meta descriptions, FAQ/schema answers, plans, compare, changelog, legal text) -> "USDT on TON"/"USDT в TON" or accurate network lists incl. Solana/Arbitrum where claims enumerate support.
- Home networks marquee: list entries converted to {slug,label} so display labels no longer double as URL slugs (was generating /networks/usdt on ton after the copy fix; also previously produced duplicate Base chips); fixed header nav label arbitrum: "Base" -> "Arbitrum" in both locales.

### mcp-server
- Fixed broken build pipeline: tsconfig rootDir/outDir enabled, package.json main/bin -> dist/index.js, prepare script compiles on npm install; deleted committed build artifacts from src/ and untracked them; added .gitignore.
- Added shebang, 15s fetch timeouts (AbortSignal.timeout), tolerant JSON parsing for non-JSON error pages; removed unused zod dependency.
- Updated install instructions (EN/RU docs + README) to the compiled dist entrypoint with a build prerequisite; added a CI job (npm ci, build, stdio smoke-start).

### Verification
- go test ./... fully green (incl. embedded-postgres suites); coverage gate run pending at session end.
- frontend-public: tsc clean, 25 unit tests pass, production build passes.
- mcp-server: npm ci + build produce dist/, stdio smoke-start OK.

### Operational follow-up (IMPORTANT)
- Before the next deploy: check /root/recv/.env for TON_USD_RATE. If present, REMOVE it - the API now fails fast in production with it set, which would fail the health gate and roll the deploy back.


### Session 2026-06-12 (continued): registry deploys, npm publishing, dynamic MCP networks

- Backend: added GET /api/public/payment-options exposing the network/asset matrix derived from store.SupportedPaymentOptions() (built on IsSupportedPaymentOption so it cannot drift); cacheable 5 min; test asserts parity with the support checks.
- MCP: list_supported_networks now fetches the live endpoint and falls back to the static list on failure; package.json gained repository/homepage/engines/publishConfig (license MIT); release-mcp.yml publishes to npm as recv-mcp on mcp-v* tags with provenance (needs NPM_TOKEN secret; name is free on npm). Docs/README switched to `npx -y recv-mcp` with from-source fallback.
- CD: deploy.yml rebuilt as two jobs — build-images pushes api/frontend-public/frontend to ghcr.io/qzbxw/recv/* (sha + latest tags, GHA layer cache, frontend build args from Actions vars with recv.money defaults), deploy SSHes, logs into GHCR with workflow GITHUB_TOKEN, persists GHCR_IMAGE_PREFIX/TAG into server .env, pulls instead of building (build kept as fallback), health gate unchanged, rollback pulls the previous SHA tag (fast) with build fallback. ENV_MATRIX documents the new secrets/vars.
- PRE-MERGE CHECKLIST: (1) remove TON_USD_RATE from /root/recv/.env; (2) if prod .env carries GTM_ID/YANDEX_METRIKA_ID/verification values, copy them into repo Actions Variables — they are now baked at CI build time; (3) create NPM_TOKEN secret and push tag mcp-v1.0.0 to publish recv-mcp BEFORE the docs go live (they reference npx recv-mcp).

## Previous task history (SEO update)

## Session 2026-06-10: claims audit and production launch checks

### Content safety
- Removed unsupported absolute KYC/anonymity, sub-second latency, guaranteed delivery, exact-once, private-node percentile, and competitor fee claims from the primary EN/RU marketing copy.
- Replaced synthetic performance statistics with stable product-capability labels.
- Added a regression test that rejects the removed high-risk claim patterns.

### Redirects and infrastructure
- Added redirect tests for root locale selection, locale-less paths with query preservation, trailing slash, `index.html`, and service-route passthrough.
- Fixed proxy normalization to construct redirects with the standard URL API; runtime checks now return 308 for `/`, `/en/`, `/en/index.html`, `/products?ref=x`, and `/docs`.
- Fixed a production Caddy validation failure caused by an empty optional `CADDY_EMAIL`.
- Fixed the Docker CI smoke job to start Caddy and test the published production port 8080 instead of an unavailable port 3000.
- Added containerized `caddy validate` to CI and documented the complete deployment/SEO/CWV procedure in `docs/SEO_DEPLOYMENT_CHECKLIST.md`.

### Verification
- Production compose config and Caddyfile validate.
- Migrations 022-026 are present in the mounted API source.
- Backend http/store/db/config tests pass.
- Public frontend: 25 unit tests, TypeScript, and production build pass.
- Fresh production runtime: SEO audit passes all 118 sitemap URLs.

## Session 2026-06-10: Playwright public-site coverage

### Implementation
- Added Playwright configuration with a production Next web server, Chromium project, failure traces/screenshots/video, CI retries, and artifacts under `output/playwright`.
- Added browser coverage for visible breadcrumbs across required page families, EN/RU article language switching, localized 404 search query preservation, all eight reciprocal article pairs, real 404 responses, and noindex service-document headers.
- Added an opt-in structured CMS article test (`PLAYWRIGHT_STRUCTURED_ARTICLE`) for article TOC navigation and image lightbox open/ESC-close behavior.
- Wired `npm run test:e2e` into the public frontend CI job after `next build`; CI installs the matching Chromium revision and system dependencies.

### Verification
- Playwright: 12 passed; one structured-CMS test skipped because no local database article currently contains a media image block.
- The initial browser revision mismatch and sequential article-matrix timeout were resolved by installing the matching revision and splitting the matrix into parallel per-slug tests.

## Session 2026-06-10: Eight bilingual article pairs

### Content
- Added 16 publish-ready EN/RU articles covering the eight planned search intents: accepting USDT on a website, non-custodial payment gateways, TRC20 payment API, TON and Telegram payments, webhook signature verification, custodial vs direct-to-wallet, multi-chain invoices, and late/underpaid/overpaid payments.
- Claims are limited to behavior supported by the repository and product docs. Every article has four H2 sections, at least two contextual internal links, 120-160 character metadata, Recv Core Team organization authorship, and reciprocal EN/RU slugs.
- Publication dates run from April 8 through May 27, 2026; each article exposes both published and updated dates through BlogPosting.

### Delivery
- `content/blog/articles.json` is the single content source.
- `npm run content:generate-blog-seed` validates the catalog and generates idempotent migration `026_seed_bilingual_articles.sql`; existing `(slug, locale)` records are never overwritten.
- Shared fallback content powers the blog hub, article routes, team publication list, article OG generation, and blog sitemaps when the backend is unavailable.
- Added migration coverage for exactly 16 seeded rows and frontend tests for locale parity, metadata, headings, internal links, author, and lookup behavior.

### Verification
- Embedded PostgreSQL migration test passed, including the second idempotent migration run.
- TypeScript passed; 20 frontend tests passed; production build passed.
- EN and RU blog sitemaps each contain eight article URLs.
- Expanded SEO crawler passed 118/118 sitemap URLs and their social assets.

## Session 2026-06-10: Breadcrumbs and schema verification

### Implementation
- Added shared `BreadcrumbJsonLd` and matched it to visible breadcrumb navigation on products/networks/use-case/comparison hubs, detail pages, blog hub/articles, docs, and the Recv Core Team page.
- Visible article and team breadcrumbs now include the current page rather than stopping at the parent hub.
- Expanded the team page with explicit expertise, role, and a real publication list sourced from published posts with a repository fallback; replaced its local avatar with next/image.
- Converted Media CMS covers on the blog hub from CSS background images to next/image with fixed containers, responsive sizes, and priority only for the featured article. Legacy external covers remain a compatibility fallback.
- Extended `audit:seo` to require visible breadcrumbs plus BreadcrumbList on the required URL families, reject Person/LocalBusiness, verify FAQPage questions and answers are visible, and validate BlogPosting author/publisher logo/dates/image/locale/canonical fields.

### Verification
- TypeScript, 17 unit tests, and production build passed.
- Expanded sitemap crawler passed all 102 URLs, including breadcrumb/schema and social-asset checks.

## Session 2026-06-10: Per-URL OG images

### Implementation
- Added `/og` localized 1200x630 PNG generation with bundled static Manrope latin+cyrillic fonts, bounded title/kicker query parameters, branded EN/RU copy, and CDN cache headers.
- Added `socialImages()` and wired all indexable static/product/network/use-case/comparison/docs/blog hub/author routes to page-specific OG metadata. Next emits matching absolute `twitter:image` metadata from the same image entries.
- Added `/og/blog/{locale}/{slug}`: published articles render a 1200x630 branded card using `og_image_url` or the cover image when present, with a content-derived title fallback when no cover exists.
- Article Open Graph, Twitter, and `BlogPosting.image` now reference the generated article card rather than an arbitrary-size source cover.
- Added `/og` to proxy passthrough. Without this, middleware redirected image requests to `/en/og`; a regression test now covers the route.
- Extended `audit:seo` to require absolute `og:image` and `twitter:image`, fetch every unique social asset, require HTTP 200 and an image content type, and verify PNG dimensions are exactly 1200x630.

### Verification
- `npx tsc --noEmit`: passed.
- `npm test`: 17 tests passed.
- Production build: passed.
- Runtime samples: static RU card and EN article card are valid 1200x630 PNGs.
- Expanded SEO audit: passed all 102 sitemap URLs and their social assets.

## Session 2026-06-10: TipTap structured editing end-to-end

### Admin SPA (frontend/)
- TipTap v3 editor as a lazy chunk (~148 KB gz, loads only in the editor): H2/H3, bold/italic/code, lists, blockquote, code block, tables (TableKit), link with internal-route suggestions and protocol validation, images from the media library, click-to-insert YouTube, custom nodes Callout (info/warning/tip), FaqList/FaqItem/FaqQuestion/FaqAnswer, CtaBlock (checkout/api/invoicing/mcp).
- Paste cleanup (`transformPastedHTML`): strips Word/Google-Docs/AI artifacts — styles, mso/gmail classes, comments, font tags, data-/aria-/on* attributes.
- Legacy posts keep the Markdown editor until "Convert to rich editor" (marked → HTML → TipTap); new and v2 posts always use TipTap; saves write `content_json` + `content_version: 2`, Markdown remains as fallback until then.
- MediaLibraryModal: upload (alt text required up front), grid with dimensions, select (prompts for alt if missing), delete (server rejects if referenced). Wired into the cover-image field too (sets URL + alt together).
- New API client functions: fetchAdminMedia/uploadAdminMedia (multipart via plain fetch)/updateAdminMediaAlt/deleteAdminMedia + AdminMedia types.

### Backend
- `admin_blog_structured.go`: structured-content sanitization on every save (drafts included) — node/mark whitelists matching the editor, link protocols (https/http/mailto/internal path; javascript:, data:, // rejected), image src policy (/media/ or https), publish-time content-image alt enforcement, YouTube embed URL pattern, callout/CTA enum checks. 16 sanitization tests + integration tests.
- Public blog API now injects width/height into structured image nodes from the media table (same batch lookup as covers).

### Public site (frontend-public/)
- `StructuredContent.tsx`: recursive renderer mirroring the backend whitelist; auto-TOC from H2/H3 (cyrillic-safe slugs, dedupe); FAQ rendered fully visible → FAQPage JSON-LD emitted only then; localized callout labels and CTA cards; tables; `LightboxImage` (next/image when dimensions known, ESC/overlay close); `LazyYouTube` (thumbnail until click, nocookie embed).
- BlogPostClient renders structured docs for v2 posts, ReactMarkdown for legacy.
- 5 new vitest tests for slugify/TOC/FAQ extraction (16 total).

### Tests
backend http+store: ok · frontend (admin): tsc + build + 14 tests ok · frontend-public: tsc + build + 16 tests ok

## Session 2026-06-09 (night): Media CMS backend

### Implementation
- Migration `025_media.sql`: media table (file_name UNIQUE, mime, byte_size, width/height, alt_text, created_by) with mime/size/dimension CHECKs.
- `store/media.go`: CRUD + `GetMediaByFileNames` batch + `CountMediaReferences` (LIKE over blog content_md/content_json/cover/og URLs).
- `http/admin_media.go`: POST/GET/PATCH/DELETE `/api/admin/media` + public `GET/HEAD /media/:file`.
  - Validation: MIME sniffed from content (DetectContentType), extension must agree, 10 MiB body cap, 40 MP / 12000 px header-stage bomb check.
  - JPEG/PNG: EXIF orientation applied (hand-rolled APP1/TIFF parser), downscale to 2400 px longest side (x/image CatmullRom), re-encode (jpeg q85 / png best). WebP/GIF: stored as-is, hard-rejected above 2400 px (no re-encoder dep).
  - File names are sha256-prefix content hashes → public serving uses `Cache-Control: immutable`; duplicate uploads dedupe via ON CONFLICT.
  - DELETE returns 409 while any blog post references the URL.
- Public blog API now embeds `cover_image_width/height` for `/media/` covers (batch lookup). BlogPostClient renders covers via next/image (priority, sizes, intrinsic dims) with `<img>` fallback for legacy external URLs.
- Next: `src/app/media/[file]/route.ts` streams media from the backend at runtime (so next/image optimizes relative /media URLs in Docker); `/media` added to proxy passthrough.
- docker-compose: `media_data` volume → `/data/media`, `MEDIA_DIR` env; documented in ENV_MATRIX.md. Config default `./data/media`.
- Dependency added: golang.org/x/image (draw scaler + webp decoder).

### Tests
| Test | Result |
|---|---|
| `go test ./...` (full backend) | Passed |
| New media tests: MIME spoofing, ext mismatch, svg reject, 413 oversize, PNG dimension bomb, EXIF orientation 6 swap, resize cap, path traversal 404, duplicate dedupe, delete-in-use 409, alt patch, public cover dimensions | Passed |
| `frontend-public` tsc + 11 unit tests + production build | Passed |

### Pending for this area
- Admin SPA media library UI (upload/picker) — do together with TipTap.
- Lightbox + body-image rendering via next/image comes with TipTap structured content.

## Session 2026-06-09 (evening): fonts + Server Components + Lighthouse CI

### Implementation
- Replaced `next/font/google` with `next/font/local`: subset latin+cyrillic variable woff2 (Manrope 34 KB, Montserrat 82 KB) generated with pyftsubset; CSS variables preserved; fallback metric overrides emitted.
- Converted MarketingLayout and 13 marketing page components to Server Components. Client islands only: `MarketingInteractions` (IntersectionObserver on `[data-reveal]` + delegated `.lend-spotlight-card` mousemove + theme), `FaqAccordion`, Header, AttributionCapture, analytics, WebVitalsReporter. Blog components stay client and import `useReveal` from its own module.
- Header now receives `nav` copy slice as prop; Footer is a Server Component — the ~290 KB i18n copy module no longer ships to the client.
- `useUI()` removed from page components; `language` is passed from route params (10 route pages updated).
- Hero sections render with `is-revealed` in SSR so above-the-fold content doesn't wait for hydration.
- robots.txt: non-standard `Content-Signal` line moved to a comment (Lighthouse SEO 0.92→1.0).
- A11y: footer column h4→div + contrast bumps, `.lang-btn-active` background #8b5cf6→#7c3aed, menu button aria-label (a11y 0.89→1.0).
- Lighthouse CI: `frontend-public/lighthouserc.json` (budgets: script 250 KB, css 64 KB; perf warn ≥0.85, SEO error ≥0.95) + `lighthouse` job in `.github/workflows/ci.yml`.

### Measurements (local prod server, mobile-throttled Lighthouse)
| Metric | Before | After |
|---|---|---|
| Home JS (gzip) | 912 KB / 23 scripts | 207 KB / 13 scripts |
| LCP | 3.8 s | 2.7 s |
| Lighthouse perf | 0.84 | 0.90–0.95 |
| Lighthouse SEO | 0.92 | 1.0 |
| Lighthouse a11y | 0.89 | 1.0 |
| audit:seo | 102/102 | 102/102 |

### Notes
- CSS splitting deferred: total CSS is ~43 KB gzip; splitting 11k-line globals.css is high-risk/low-reward.
- No raster CSS backgrounds exist (gradients only). Remaining `<img>`: blog cover/body + author avatar — convert with Media CMS (stored dimensions).
- Local lighthouse needs `CHROME_PATH=~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome` (WSL `google-chrome` is a Windows shim and fails).

## Session 2026-06-09

### Audit
- Inspected repository tree, git state, recent commits, deployment files, SEO helpers, and root layout.
- Confirmed current architecture and existing localized SEO implementation.
- Replaced stale planning files with this task's persistent plan.

### Implementation
- Added URL normalization proxy and server-derived document language.
- Removed client canonical mutation and remote Google font requests.
- Split sitemap routes by EN/RU and pages/docs/blog chunks.
- Added private noindex, cache, compression, canonical host, and JSON logging edge configuration.
- Added migration 022 and expanded blog store/admin/public contracts for structured content and SEO controls.
- Added publish-time content/heading/alt/description validation with legacy Markdown H1 migration.
- Added editable guarded robots settings API.
- Corrected BlogPosting, author Organization, publisher, and breadcrumbs schema.
- Added optional analytics/verification and lazy-loaded the admin editor.
- Added sitemap-driven production SEO audit.
- Normalized metadata descriptions and heading levels until the production crawler passed all 102 sitemap URLs.
- Added migration 023, guarded admin redirect CRUD, cycle detection, a cached public resolver, proxy integration, and admin management UI.
- Added migration 024 and anonymous first-party LCP/INP/CLS collection with a rolling 28-day p75 admin dashboard.

### Tests
| Test | Result |
|---|---|
| `frontend-public npm test` | 11 tests passed |
| `frontend-public npx tsc --noEmit` | Passed after redirect and Web Vitals additions |
| `frontend-public npm run build` | Previously passed; latest Turbopack run is sandbox-blocked on an internal localhost port. Webpack compilation and standalone TypeScript pass. |
| `frontend npm run build` | Passed after redirect and Web Vitals dashboard additions; AdminBlogPage remains about 14 KB |
| `backend go test ./...` | Passed |
| Latest backend package compile | Passed with `go test -c`; targeted runtime is blocked by package `TestMain` opening localhost |
| Local HTTP smoke tests | 308 redirects, UTM retention, RU source lang, one canonical/H1, real 404, and EN/RU sitemap index verified |
| `frontend-public npm run audit:seo` | Passed for all 102 sitemap URLs |
| Caddy validation | Docker CLI unavailable in WSL |
