# Task Plan: Fix Mobile Burger Menu on Landing Page

## Goal
Fix the mobile burger menu layout issue on the landing page, where only a small part of the menu is visible when opened, by moving the mobile menu markup outside the `<header>` element to resolve the containing block clipping caused by `backdrop-filter`.

## Current Phase
Complete

## Phases

### Phase 1: Requirements & Discovery
- [x] Diagnose why the mobile menu is partially hidden/clipped (resolved: `backdrop-filter: blur` on `<header>` forms a new containing block, restricting the `fixed inset-0` child).
- [x] Identify the Header file: [Header.tsx](file:///home/qzbx/projs/recv/frontend-public/src/components/marketing/Header.tsx).
- **Status:** complete

### Phase 2: Implementation
- [x] Wrap `Header.tsx` return value in a React Fragment (`<>...</>`).
- [x] Move the `isMenuOpen && (...)` mobile menu block outside the `<header>` tag.
- [x] Keep the z-index of the mobile menu at `z-[90]` (below header's `z-[100]` to keep the header close button visible, but above body content).
- **Status:** complete

### Phase 3: Testing & Verification
- [x] Run Next.js production build (`npm run build`) to ensure compilation succeeds.
- [x] Run localization tests (`npm test`).
- **Status:** complete

### Phase 4: Delivery
- [x] Confirm fix to the user.
- **Status:** complete

## Key Questions
1. Does the change preserve mobile menu functionality? (Yes, the open/close state is managed by the same state hook in the same component).
2. Does the close button remain visible/interactive? (Yes, `<header>` remains on top with `z-[100]`).

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Move mobile menu sibling to `<header>` | Avoids browser layout engine constraints on fixed descendants inside `backdrop-filter` parent elements. |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       |         |            |
