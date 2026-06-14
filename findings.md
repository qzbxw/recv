# Findings & Decisions

## Requirements
- Update terms and privacy policies.
- Address missing entity details and placeholders.
- Handle analytics cookies, consent, GTM, Yandex Metrica.
- Create Data Processing Addendum (DPA) and list of Subprocessors.
- Align code statements on security (JWT signing, webhook signing secret storage, API keys hashing).
- Match pricing plans to backend implementation.
- Correct refund policy and blockchain reconciliation matching statements.
- Implement clickwrap / terms acceptance in frontend and agent bootstrap.
- Correct/translate Russian version and clause on language priority.

## Research Findings
- Found `frontend-public/src/components/LegalPageClient.tsx` where `legalCopy` is loaded. It currently overrides English sections with Russian sections:
  ```typescript
  legalCopy.privacy.en.sections = legalCopy.privacy.ru.sections;
  legalCopy.terms.en.sections = legalCopy.terms.ru.sections;
  ```
  And in `ru.ts`, the sections are in English, resulting in English-only pages for both paths.
- Found `frontend-public/src/i18n/en.ts` contains `legal.privacy` structure with kicker, title, summary, metaItems, draftTitle, draftBody, draftItems, sections (1, 2, 3, etc.).
- Inspecting `frontend-public/src/i18n/en.ts`:
  - Section 5 of Privacy currently says: "5.1. Explicit Rejection of Marketing Cookies: The Company does not utilize third-party advertising cookies, cross-site tracking pixels, or invasive analytics trackers." This is incorrect because OptionalAnalytics.tsx, AttributionCapture.tsx, and WebVitalsReporter.tsx are used.
  - Section 6 of Privacy lists third-party sub-processors, mentioning AWS/DigitalOcean/Cloudflare as examples.
  - Section 9 of Privacy mentions "Exemption from Regulatory Regimes" ("operates outside GLBA or PCI-DSS").
  - Section 13 of Terms: Placeholder in 13.1 for arbitration (e.g. ICC or courts of Panama/BVI).
  - Section 7 of Terms lists PRO, DEV, ENTERPRISE paid plans and says "strictly NON-REFUNDABLE".
  - Section 5.1 of Terms mentions Smart-Tracking matching protocol decimal suffix for TRON/Base/BSC and comment for TON.
  - Section 6.3 of Terms describes X-recv-Signature.
- Found that `OptionalAnalytics` is imported and mounted inside `frontend-public/src/app/[locale]/layout.tsx` at line 102. It currently receives GTM ID and Yandex Metrika ID and loads them directly.
- `AttributionCapture.tsx` reads and writes `recv_attr` cookie with 90 days lifetime, reporting UTM visit information.
- `WebVitalsReporter.tsx` sends LCP, INP, CLS performance measurements to `/api/public/web-vitals`.
- There is currently no analytics consent logic or banner. GTM and Yandex load unconditionally.
- Found in `frontend/src/pages/AuthPortalPage.tsx` that registration can happen via:
  - Automatic authentication on mount if `Telegram.WebApp.initData` is present.
  - Verification code authentication when clicking submit on the standard code login/signup form.
  - Dev authentication when using a dev-only form.
- Found in `backend/internal/store/plans.go` that the real plans are `merchant` ($9), `developer` ($29), and `business` ($79), each for 30 days.
- Found that `frontend/src/pages/LegalPage.tsx` also overrides English with Russian sections.
- Found that `frontend/src/i18n/en.ts` contains an identical `legal` structure to `frontend-public/src/i18n/en.ts`, though starting at a different line number.
- Found `bootstrap_agent_workspace` schema in `mcp-server/src/index.ts` with properties `workspace_name` and `contact_email`.
- Located route `/api/auth/agent/bootstrap` mapped to `server.handleAgentBootstrap` in `backend/internal/http/server.go`. It decodes `service.AgentBootstrapInput` and delegates to `s.authService.BootstrapAgentWorkspace(ctx, body)`.
- In `backend/internal/service/auth.go`, `AgentBootstrapInput` has fields: `WorkspaceName`, `ContactEmail`, `Attribution`, and `RefCode`.
- There are no database columns for tracking `terms_version` or acceptance timestamps yet, which is marked as a future item ("в дальнейшем").
- No automatic database deletion or cleanup mechanisms (like cron jobs or worker processes to delete expired sessions/logs) currently exist in the store methods.
- The `frontend-public` codebase uses Tailwind CSS v4 for styling. We should use Tailwind classes to implement a premium glassmorphic Cookie Consent Banner.
- Decided to extend `LegalVariant` to `"privacy" | "terms" | "dpa" | "subprocessors"` in both frontend projects to support the new Data Processing Addendum and Subprocessor List dynamically.
- Next.js routing in `frontend-public` maps `/privacy` and `/terms` to directories. We can create `/dpa` and `/subprocessors` directories in `frontend-public/src/app/[locale]/` with `page.tsx` that renders the LegalPage component with variant="dpa" and variant="subprocessors".
- Found in `frontend/src/App.tsx` that the SPA router maps main console routes but doesn't explicitly expose `/privacy` or `/terms` anymore, mapping other routes back to `/`. However, the legal copy files are maintained for consistency. We can add Route entries for `/privacy`, `/terms`, `/dpa`, `/subprocessors` in the SPA router to prevent dead pages if someone Navigates there directly inside the SPA namespace.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Use 'operators of recv.money' as service provider | The user does not have a registered legal entity yet and prefers to refer to the operators of the website directly. |
| Use Cyprus as default jurisdiction | Tentative choice for tech/crypto startups as requested by the user. |
| Extend LegalVariant to dpa and subprocessors | To natively support separate pages/tabs/components for DPA and Subprocessors without ad-hoc files. |
| Create dpa and subprocessors routes in Next.js public frontend | Enables direct clean URLs `/dpa` and `/subprocessors` on the public website. |
| Map legal routes in SPA frontend App.tsx | Ensures SPA continues to support pages `/privacy`, `/terms`, `/dpa`, `/subprocessors` seamlessly. |
