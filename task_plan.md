# Task Plan: Production-Readiness Audit (code-only, security excluded)

## Goal
Full production-readiness audit of recv: SEO/organic traffic, landing, checkout flow, backend (API/watcher/bot), MCP server, AI integration, infra/CI. Prod (recv.money) is mid-deploy — audit from code only. Deliverable: a findings report, no fixes unless asked.

## Phases

### Phase 1: Infra, compose, CI, edge
- [ ] docker-compose (dev/prod), Caddyfile, nginx, CI workflows, deploy flow
- **Status:** complete

### Phase 2: frontend-public (SEO/landing)
- [ ] Metadata, sitemaps, robots, hreflang, structured data, OG, i18n, perf (fonts, images, bundle), blog/content pipeline
- **Status:** complete

### Phase 3: frontend (Vite SPA: checkout, seller console, admin)
- [ ] Checkout UX/robustness, error handling, build health, tests
- **Status:** complete

### Phase 4: backend (Go)
- [ ] API structure, checkout/payment logic, watcher, bot, migrations (incl. dead 026/027), tests, config/env matrix
- **Status:** complete

### Phase 5: mcp-server + AI integration
- [ ] MCP server code quality, tooling surface, AI usage anywhere in repo
- **Status:** complete

### Phase 6: Synthesis
- [ ] Compile prioritized report (blockers / high / medium / nice-to-have)
- **Status:** complete

## Key Questions
- Anything that breaks indexing or organic traffic (sitemap, canonical, hreflang, noindex leaks)?
- Is checkout robust (payment edge cases, error states, idempotency)?
- Are migrations consistent (memory says 026/027 are dead weight)?
- Is mcp-server production-grade (error handling, transport, versioning)?

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
