# Roadmap: AI Matrix E-commerce Platform

**Milestone:** v1.2 — Shopping Cart & Checkout

## Phases

- [ ] **Phase 6: Shopping Cart** - Add to cart, update quantities, remove items
- [ ] **Phase 7: Order Management** - Checkout, order history, order status

---

## v1.1 Complete

**v1.1 — Feature Implementation** ✅ Complete

User Authentication (Phase 4) + Product Catalog (Phase 5) | [Full roadmap](.planning/milestones/v1.1-ROADMAP.md) | [Requirements](.planning/milestones/v1.1-REQUIREMENTS.md)

---

## v1.2 — Shopping Cart & Checkout (Planned)

### Phase 6: Shopping Cart

**Goal:** Users can manage shopping cart items

**Depends on:** Phase 5

**Requirements:** CART-01, CART-02, CART-03

**Plans:**
- [ ] 06-01-PLAN.md — Backend: session middleware, auth integration, cart model update
- [ ] 06-02-PLAN.md — Frontend: Zustand backend sync, ProductDetail integration, cart page

### Phase 7: Order Management

**Goal:** Users can checkout and view order history

**Depends on:** Phase 6

**Requirements:** ORDER-01, ORDER-02, ORDER-03

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 4. User Authentication | 1/1 | ✅ Complete | 2026-04-16 |
| 5. Product Catalog | 1/1 | ✅ Complete | 2026-04-16 |
| 6. Shopping Cart | 0/2 | 2 plans pending | - |
| 7. Order Management | 0/1 | Not started | - |

---

## Traceability

| Phase | Requirements | Status |
|-------|--------------|--------|
| Phase 4 | AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10 | ✅ Complete |
| Phase 5 | CAT-01, PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06 | ✅ Complete |
| Phase 6 | CART-01, CART-02, CART-03 | Pending |
| Phase 7 | ORDER-01, ORDER-02, ORDER-03 | Pending |

**Coverage:**
- v1.1 + v1.2 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---

## Dependencies

```
Phase 6 (Shopping Cart)
├── Backend: Cart model + CartItem model (existing from Phase 1)
├── Frontend: Cart page (existing scaffold from Phase 2)
├── Depends on: Phase 5 (Product Catalog)
└── 2 Plans: Wave 1 (Backend), Wave 2 (Frontend + Integration)

Phase 7 (Order Management)
├── Backend: Order model + OrderItem model (existing from Phase 1)
├── Frontend: Checkout page, Order history page (existing scaffold)
├── Depends on: Phase 6 (Shopping Cart)
└── No circular dependencies
```

---

*Roadmap updated: 2026-04-20 after Phase 6 planning*
