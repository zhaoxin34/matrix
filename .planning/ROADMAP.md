# Roadmap: AI Matrix E-commerce Platform

**Milestone:** v1.1 — Feature Implementation

## Phases

- [ ] **Phase 4: User Authentication** - Secure user registration, login, logout, and password reset
- [ ] **Phase 5: Product Catalog** - Browse products, search, filter, and sort

---

## Phase Details

### Phase 4: User Authentication

**Goal:** Users can securely create accounts and access the platform

**Depends on:** Phase 3

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10

**Success Criteria** (what must be TRUE):

1. User can register with phone number and password, receiving JWT access and refresh tokens
2. User can login with phone/password and access protected endpoints with the returned JWT
3. User can refresh an expired access token using the refresh token mechanism
4. User can logout and have their tokens invalidated
5. User can request a password reset via phone/SMS and successfully reset their password
6. Auth endpoints enforce rate limiting (5 login/IP/15min, 3 register/IP/hour, 3 reset/phone/day)
7. Protected API endpoints correctly identify the current user from JWT

**Plans:** TBD

**UI hint:** yes

---

### Phase 5: Product Catalog

**Goal:** Users can browse, discover, and view product details

**Depends on:** Phase 4

**Requirements:** CAT-01, PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06

**Success Criteria** (what must be TRUE):

1. User can navigate a two-level category hierarchy (L1 categories on homepage, L2 subcategories on selection)
2. User can browse product listings with pagination (20 items per page, navigation controls)
3. User can view product details including image carousel, price, stock status, and SKU variant selector
4. User can search products by keyword (minimum 2 characters, maximum 50 results)
5. User receives search autocomplete suggestions as they type (top 10 matches, debounced)
6. User can filter products by brand, price range, and stock status
7. User can sort products by price, sales volume, or newest

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 4. User Authentication | 0/1 | Not started | - |
| 5. Product Catalog | 0/1 | Not started | - |

---

## Traceability

| Phase | Requirements | Status |
|-------|--------------|--------|
| Phase 4 | AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10 | Pending |
| Phase 5 | CAT-01, PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06 | Pending |

**Coverage:**
- v1.1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---

## Dependencies

```
Phase 4 (Auth)
├── Backend: FastAPI + JWT libraries (python-jose, passlib, bcrypt)
├── Frontend: React + Zustand + Axios (existing scaffold)
├── Database: User model (existing from Phase 1)
└── Depends on: Phase 3 (Integration & DevOps)

Phase 5 (Product Catalog)
├── Backend: Product model + Category model (existing from Phase 1)
├── Frontend: Product listing/detail pages (existing scaffold)
├── Depends on: Phase 4 (Auth dependency for protected operations)
└── No circular dependencies
```

---

*Roadmap created: 2026-04-16 for milestone v1.1*
