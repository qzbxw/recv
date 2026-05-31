# Progress Log

## Session: 2026-05-31

### Phase 1: Requirements & Discovery
- **Status:** complete
- **Started:** 2026-05-31T20:57:00
- Actions taken:
  - Scanned Go API server routes and models.
  - Inspected blockchain watchers and specs, verifying only USDT and native TON are supported.
  - Checked webhook dispatch logic and headers/signature algorithm.
  - Examined plans catalog and limits.
- Files created/modified:
  - `task_plan.md`
  - `findings.md`
  - `progress.md`

### Phase 2: Refactoring Marketing Translation Files
- **Status:** complete
- Actions taken:
  - Removed USDC references from `en.ts`, `ru.ts`, `plans.en.ts`, and `plans.ru.ts`.
  - Updated supported assets to correctly reflect USDT and native TON support.
  - Removed misleading/exaggerated claims about FaceID/TouchID, TWA native haptic feedback, 20+ languages global reach, and custom branding in the checkout page (since the Vite app handles payments purely via copy-paste/QR code and deep links to mobile wallets like Tonkeeper/Phantom).
  - Aligned JS code snippets for invoice creation and webhook signature validation in `ProductPageClient.tsx`.

- Files created/modified:
  - `frontend-public/src/i18n/en.ts`
  - `frontend-public/src/i18n/ru.ts`
  - `frontend-public/src/i18n/plans.en.ts`
  - `frontend-public/src/i18n/plans.ru.ts`
  - `frontend-public/src/components/ProductPageClient.tsx`

### Phase 3: Updating Developer Documentation (MDX files)
- **Status:** complete
- Actions taken:
  - Aligned parameter names, Python examples, response fields, and status list in `invoices.mdx` (en/ru).
  - Corrected headers list, JSON schemas for `invoice.paid` and `subscription.activated` events, signature hashing algorithm, and timing-safe Node.js code snippets in `webhooks.mdx` (en/ru).
  - Aligned error response schema, workspace plan rate limits, and webhook retry limits in `errors.mdx` (en/ru).
- Files created/modified:
  - `frontend-public/content/docs/en/invoices.mdx`
  - `frontend-public/content/docs/ru/invoices.mdx`
  - `frontend-public/content/docs/en/webhooks.mdx`
  - `frontend-public/content/docs/ru/webhooks.mdx`
  - `frontend-public/content/docs/en/errors.mdx`
  - `frontend-public/content/docs/ru/errors.mdx`

### Phase 4: Testing & Verification
- **Status:** complete
- Actions taken:
  - Ran `npm test` inside `frontend-public` ensuring translation tests pass.
  - Ran `npm run build` inside `frontend-public` to verify TypeScript type checking and Next.js static generation compiles correctly.
- Files created/modified:
  - None (validation check only).

## Test Results
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Translation Tests | `npm test` | All tests pass | All tests passed successfully | success |
| Next.js Production Build | `npm run build` | Builds successfully without type/TS/remote compile errors | Compiled and optimized successfully (84/84 static pages generated) | success |

