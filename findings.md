# Findings: Comprehensive recv SEO Update

## Repository
- Public marketing/docs/blog: Next.js app in `frontend-public`.
- Private product/admin SPA: Vite React app in `frontend`, served through nginx.
- API/CMS: Go backend with PostgreSQL SQL migrations.
- Edge: Caddy proxies the combined frontend nginx service.
- Only untracked files are the supplied root DOCX and its `:Zone.Identifier`.

## Existing SEO Foundation
- Localized routes exist under `/en` and `/ru`.
- Metadata helpers, breadcrumbs, JSON-LD, localized blog translations, sitemap routes, robots, RSS, and generated OG images already exist.
- Canonical origin helper defaults to `https://recv.money`.
- Public route registry includes product, network, use-case, comparison, docs, and company pages.

## Confirmed Gaps
- Root layout hardcodes `<html lang="en">`; Russian source HTML is therefore incorrect.
- Root layout downloads two Google font families with many weights rather than local variable fonts.
- Caddy only applies compression/security headers and proxies all traffic; canonical redirects, private noindex headers, immutable static caching, and structured 404 access logging are absent.
- Current sitemap organization uses flat filenames rather than `/sitemaps/{locale}/{pages|docs|blog-*}`.
- `.gitignore` does not ignore the supplied DOCX files.
- Existing planning files described an unrelated completed mobile-menu task and were replaced for this work.

## Constraints
- Local repository work cannot submit sitemaps to external webmaster accounts or observe production CWV for 28 days.
- Broad content rewrites must remain grounded in current product behavior and claims.

## Implemented
- Next proxy normalizes root, locale-less paths, trailing slashes, and `index.html` with 308 while retaining query parameters.
- Root layout receives locale through a request header, producing source `html lang="ru"` for Russian pages.
- MarketingLayout no longer mutates canonical tags on the client.
- Sitemap index is split by locale and content type; blog entries are filtered by index/sitemap flags and expose alternates only for published translations.
- Caddy/nginx add private noindex headers, immutable static caches, compression, canonical host redirects, and JSON access logs.
- Blog schema now uses Organization author/publisher, canonical mainEntityOfPage, logo, image, dates, locale, and breadcrumb schema.
- Migration 022 adds structured JSON content and article SEO controls. Backend validates publish-time H1, description, cover alt, and H2/H3 hierarchy.
- Robots content is editable through guarded admin/public APIs with a safe fallback.
- Optional GTM/Yandex and verification metadata render only when configured.
- Admin editor dependency is lazy-loaded, reducing the route chunk from about 1.07 MB to about 14 KB before the editor is opened.
- Production SEO crawler script was added.
- Metadata descriptions are normalized to 120-160 characters, duplicate hub/plan titles were separated, and shared card heading levels were corrected.
- Admin-managed 301/302/308 redirects now include source/target validation, cycle prevention, a public resolver, and a 60-second proxy cache that preserves attribution query parameters.
- Anonymous first-party Web Vitals collection stores no IP or user-agent data and reports rolling 28-day p75 LCP, INP, and CLS against the requested thresholds.

## Remaining Audit Findings
- The automated HTML/SEO crawler now passes all 118 sitemap URLs, including the 16 new bilingual article URLs.
- Every audited URL now exposes absolute OG/Twitter image metadata; all unique social assets return images, and generated PNGs validate at 1200x630. Article cards use cover media when available and a branded title fallback otherwise.
- Required hubs/details/articles/docs/team URLs now have visible breadcrumbs paired with BreadcrumbList. The crawler also enforces visible FAQ content, complete BlogPosting fields, and absence of Person/LocalBusiness.
- Playwright covers the stable public workflows in CI. TOC/lightbox e2e is parameterized against a real structured CMS article rather than a synthetic production route.
- Marketing pages are Server Components; fonts are self-hosted subset variable woff2; Lighthouse CI with budgets is wired into GitHub Actions. Home JS dropped 912→207 KB gzip; local mobile Lighthouse: perf ~0.90, SEO 1.0, a11y 1.0.
- High-risk unsupported marketing absolutes and synthetic performance metrics were removed from the primary EN/RU copy; a regression test guards the removed patterns.
- Production compose and Caddy now validate in-container. CI starts the actual Caddy edge on port 8080, and the deployment-only sitemap submission/Rich Results/28-day CWV work is recorded in `docs/SEO_DEPLOYMENT_CHECKLIST.md`.
- The planned eight bilingual article pairs, per-URL OG, breadcrumbs/schema, structured CMS, media pipeline, and stable Playwright workflows are complete. Remaining work is broader page-by-page copy refinement and post-deploy webmaster/CWV operations.
- Deferred consciously: splitting globals.css by page type (total CSS ~43 KB gzip — low reward, high regression risk).
