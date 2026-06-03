# Findings & Decisions: Mobile Burger Menu Fix

## Requirements
- Fix the mobile burger menu on the landing page, which only displays a small top slice when opened on mobile viewports.

## Research Findings
- **Layout engine containing block rule:**
  - When a CSS property like `backdrop-filter`, `transform`, `filter`, or `perspective` is set on a parent element, browsers treat that parent as the containing block for all its descendants, including those styled with `position: fixed`.
  - In [Header.tsx](file:///home/qzbx/projs/recv/frontend-public/src/components/marketing/Header.tsx), the `<header>` element has `backdrop-blur-xl` which compiles to `backdrop-filter: blur(24px)`.
  - The mobile menu `.fixed.inset-0.top-0` is rendered inside the `<header>` tag.
  - This results in the mobile menu matching the dimensions of the header bar (approx 60-80px tall) instead of the entire viewport screen, hiding the rest of the menu items.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Move mobile menu markup outside the `<header>` container | This removes the mobile menu from the containment of the `backdrop-filter` parent, allowing `fixed inset-0` to correctly span the entire viewport. |
| Use React Fragment wrapper | Allows returning two root-level sibling nodes (`<header>` and mobile menu `div`) from the single component. |

## Resources
- Component: [Header.tsx](file:///home/qzbx/projs/recv/frontend-public/src/components/marketing/Header.tsx#L175-L210)
