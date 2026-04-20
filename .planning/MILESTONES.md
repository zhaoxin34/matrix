# Milestones

## v1.2 — Shopping Cart & Checkout

**Shipped:** 2026-04-20
**Phases:** 6-7 | **Plans:** 4 | **Tasks:** ~14

### Key Accomplishments

1. Dual-identity cart: guest users (session_id cookie) and authenticated users (JWT) supported
2. Add-to-cart with SKU variant selection enforcement and stock warnings
3. Cart merge on login: guest cart transferred to user cart on authentication
4. Checkout flow with address management (CRUD)
5. Order history and order detail pages
6. Cart-to-order conversion with stock deduction

### Stats

- **Timeline:** 2 days (2026-04-19 to 2026-04-20)
- **Commits:** ~30 commits across phases 6-7
- **Files changed:** ~300 files, +17565 lines, -2257 lines

### Known Deferred Items

- UAT gaps in Phase 04, 06, 07 (see STATE.md Deferred Items)
- E2E test automation not completed

---

## v1.1 — Feature Implementation

**Shipped:** 2026-04-16
**Phases:** 4-5 | **Plans:** 2 | **Tasks:** ~12

### Key Accomplishments

1. JWT authentication with phone login and SMS verification (mocked)
2. Password reset flow with token-based recovery
3. Product catalog with category hierarchy and search/filter
4. Product detail page with image carousel

---

*v1.1 and earlier milestones documented in archived ROADMAP files*
