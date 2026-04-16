# Project Research Summary

**Project:** AI Matrix - E-commerce Demo Platform
**Domain:** E-commerce User Authentication and Product Catalog
**Researched:** 2026-04-16
**Confidence:** MEDIUM (Architecture research not yet completed)

## Executive Summary

This e-commerce platform serves as a simulation testbed for AI autonomous decision-making research. The technology stack (Python FastAPI + React TypeScript) is already in place with all necessary dependencies installed. Research confirms no new core libraries are required for the initial feature set (user auth and product catalog) -- the existing JWT libraries (python-jose, passlib, bcrypt) and frontend state management (Zustand, Ant Design) are sufficient.

**Key recommendation:** Build custom JWT authentication using existing libraries rather than fastapi-users. This provides maximum control over the auth flow, which is critical for future AI agent integration where agents will need to observe and manipulate authentication state.

The primary risk is security debt from incomplete auth implementation (no refresh tokens, hardcoded secrets, no rate limiting). These are well-understood patterns with clear solutions. Feature research identifies clear MVP scope and dependency chains. Pitfall research surfaces 10 common issues with explicit phase mapping for prevention.

---

## Key Findings

### Recommended Stack

**Confidence:** HIGH

The existing stack already contains all essential building blocks. No new core dependencies required for auth or product catalog features.

**Core technologies:**
- **FastAPI (>=0.109.0)** -- Web framework, already installed
- **python-jose + passlib + bcrypt** -- JWT auth, already installed; build custom auth dependency for AI agent observability
- **SQLAlchemy (>=2.0.0)** -- ORM with native filtering/pagination, already installed
- **React (^18.2.0) + axios** -- Frontend framework and HTTP client with interceptors, already installed
- **Zustand (^4.5.2)** -- Auth state management pattern, already installed
- **Ant Design (^5.15.0)** -- UI components including Table with pagination, already installed

**Recommended additions:**
- **PyJWT (>=2.8.0)** -- More actively maintained JWT library; optional but recommended for cleaner API
- **@tanstack/react-query (^5.60.0)** -- Optional; only needed if complex caching/invalidation needs arise

**What NOT to use:**
- fastapi-users (adds abstraction, limits AI agent observability)
- Redux (overkill vs Zustand)
- Express-session/cookie auth (JWT Bearer tokens are standard for SPA+API)
- SQLAlchemy-Filters (native .filter() is sufficient)

### Expected Features

**Confidence:** HIGH

**Must have (table stakes -- MVP launch):**
- User Registration (phone + password) -- P1
- User Login (phone + password) -- P1
- Password Reset via SMS -- P1
- Category Navigation (2-level L1 -> L2) -- P1
- Product Listing (grid with image, name, price) -- P1
- Product Detail Page (images, price, SKU selector, stock) -- P1
- Search with Autocomplete (keyword suggestions) -- P1

**Should have (competitive advantage -- v1.x):**
- WeChat OAuth Login -- reduce signup friction
- Product Filtering (brand, price range)
- Product Sorting (sales, newest, price)
- Fast Reorder / Quick Buy -- drive repeat purchase

**Defer (v2+):**
- Voice Search -- requires ML, low priority for FMCG
- Image Search -- complex, niche use case
- Personalized Recommendations -- needs data volume and ML infrastructure

**Feature dependencies:**
- User Login requires Registration
- Product Detail requires Listing
- Search requires Search Index
- Cart requires Login (cart is per-user, not localStorage)

### Architecture Approach

**Note:** ARCHITECTURE.md was not included in research files. This section is based on STACK.md integration points and PITFALLS.md patterns.

**Auth flow (backend):**
```
POST /auth/register -> Create user (hash password)
POST /auth/login -> Validate, return JWT (access + refresh)
POST /auth/refresh -> Exchange refresh for new access
POST /auth/logout -> Invalidate token
GET /auth/me -> Get current user (protected)
```

**Auth pattern (frontend):**
- Zustand auth store for client state
- Axios interceptor for JWT injection
- Protected route wrapper using auth state

**Product catalog pattern:**
- Backend: SQLAlchemy select() with offset/limit, .filter(), .order_by()
- Frontend: Ant Design Table with pagination, Card grid for products

**Major components to design:**
1. **Auth Service** -- JWT creation/validation, password hashing, token refresh
2. **User Repository** -- User CRUD, password reset token management
3. **Product Repository** -- Product queries, filtering, search, pagination
4. **Auth Store (Frontend)** -- Zustand store for auth state
5. **API Client (Frontend)** -- Axios instance with interceptors

### Critical Pitfalls

**Confidence:** MEDIUM

**Top 5 pitfalls to prevent:**

1. **No Refresh Token Mechanism** -- Users get logged out every 30 minutes. Implement short-lived access tokens (15-30 min) + longer-lived refresh tokens (7-14 days) with /auth/refresh endpoint.

2. **Hardcoded SECRET_KEY** -- Default "your-secret-key-change-in-production" in code. Remove default, add startup validation, require env var in production.

3. **No Rate Limiting on Auth Endpoints** -- Brute force vulnerability. Add slowapi middleware, account lockout after N failed attempts, progressive delays.

4. **Missing Current User Dependency** -- Protected endpoints cannot identify users. Implement get_current_user dependency wired into FastAPI dependency system.

5. **Password Reset Not Implemented** -- Blocks MVP completeness. Add password_reset_token field, /auth/forgot-password, /auth/reset-password endpoints.

**Additional product catalog pitfalls:**
6. **Frontend/Backend Schema Mismatch** -- Product.images field missing in backend model
7. **No Product Search** -- Users cannot find products by name
8. **No SKU/SPU Distinction** -- Cannot track stock per variant
9. **Missing Input Validation** -- Negative prices, excessive page_size accepted
10. **No Image Upload** -- Product carousel requires upload mechanism

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation Infrastructure
**Rationale:** Establish database models, migrations, and seed data. No auth or business logic yet.
**Delivers:** Database schema, migration system, product/seed data for testing
**Uses:** SQLAlchemy 2.0, MySQL
**Avoids:** Starting with auth (which depends on User model) before foundation is solid

### Phase 2: Auth Backend (Custom JWT)
**Rationale:** Auth is prerequisite for most features. Build custom JWT using existing libraries (not fastapi-users) for AI agent observability.
**Delivers:** User model, registration, login, logout, refresh token, get_current_user dependency, rate limiting
**Uses:** python-jose, passlib, bcrypt, slowapi
**Implements:** Auth Service, User Repository
**Avoids:** Pitfall 1 (refresh tokens), Pitfall 2 (SECRET_KEY validation), Pitfall 3 (rate limiting), Pitfall 4 (current user dependency)

### Phase 3: Product Catalog Backend
**Rationale:** Core product domain. Build API before frontend to enable parallel development.
**Delivers:** Product CRUD, category tree, listing with pagination/filter/sort, search endpoint
**Uses:** SQLAlchemy filtering, pagination
**Implements:** Product Repository
**Avoids:** Pitfall 7 (no search), Pitfall 8 (SKU/SPU modeling), Pitfall 9 (input validation), Pitfall 10 (image upload infrastructure)

### Phase 4: Frontend Auth + Product UI
**Rationale:** UI layer for features built in Phase 2-3. Zustand store, protected routes, product listing/detail pages.
**Delivers:** Login/register forms, auth state management, product grid, product detail, category navigation
**Uses:** React, Zustand, Ant Design, axios interceptor
**Implements:** Auth Store, Product Pages
**Avoids:** Pitfall 6 (schema mismatch -- verify during integration)

### Phase 5: Search + Advanced Features
**Rationale:** Search is critical for usability. Add after basic catalog is working.
**Delivers:** Search with autocomplete, search suggestions, real-time stock display
**Uses:** Search index (database ILIKE initially)
**Implements:** Search API, autocomplete UI

### Phase 6: Order/Cart Foundations
**Rationale:** Cart depends on auth (user-scoped) and product catalog. Builds on previous phases.
**Delivers:** Cart CRUD, order creation, order history
**Uses:** Auth dependency, product queries
**Prerequisites:** Phase 2 (auth), Phase 3 (product catalog)

### Phase Ordering Rationale

- **Foundation first:** Database and migrations must precede all business logic
- **Auth before cart/orders:** Cart is per-user; cannot build without auth
- **Backend before frontend:** API contracts defined early enable parallel frontend/backend
- **Product catalog before search:** Search extends catalog; must have product listing first
- **Auth pitfalls in Phase 2:** Rate limiting, refresh tokens, secret keys -- all auth infrastructure together
- **Schema alignment verified in Phase 4:** Frontend/backend mismatch caught during integration

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Product Catalog):** SKU/SPU data modeling -- may need additional research if variants are complex
- **Phase 5 (Search):** Full-text search scaling -- database ILIKE works for MVP, may need elasticsearch later
- **Phase 6 (Cart/Orders):** Order state machine, payment mockup -- not researched yet

Phases with standard patterns (skip research-phase):
- **Phase 2 (Auth):** JWT patterns well-documented via Context7 sources
- **Phase 4 (Frontend UI):** React + Ant Design patterns are standard, well-documented

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All dependencies verified in requirements.txt and package.json; Context7 sources confirm patterns |
| Features | HIGH | PRD sourced, competitor analysis (JD.com, Tmall, Meituan) validated |
| Architecture | LOW | ARCHITECTURE.md not in research files; patterns inferred from stack integration points |
| Pitfalls | MEDIUM | Codebase analysis + OWASP/FastAPI docs; some patterns may be missed |

**Overall confidence:** MEDIUM

### Gaps to Address

- **ARCHITECTURE.md missing:** Component boundaries, data flow diagrams, and system design not yet documented. Requires dedicated architecture research phase before detailed planning.
- **SKU/SPU complexity:** Not fully scoped; PRD mentions variants but complexity TBD. May need spike during Phase 3.
- **Image upload infrastructure:** Cloud storage decision (S3 vs R2 vs MinIO) not made. Affects Phase 5.
- **SMS service integration:** Password reset requires SMS provider; not researched. May need third-party service.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/fastapi/fastapi` -- OAuth2 JWT authentication patterns
- Context7 `/websites/sqlalchemy_en_20` -- SQLAlchemy 2.0 filtering and pagination
- FastAPI Security Best Practices: https://fastapi.tiangolo.com/tutorial/security/
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

### Secondary (MEDIUM confidence)
- Context7 `/pmndrs/zustand` -- Zustand state management
- Context7 `/tanstack/query` -- TanStack Query patterns
- PRD: `products/ecommerce/PRD-快消品电商用户端功能.md` (V1.0, 2026-04-15)
- Industry benchmarks: JD.com, Tmall, Meituan, Pinduoduo

### Tertiary (LOW confidence)
- E-commerce Platform Common Pitfalls -- Industry experience, may not cover edge cases
- JWT Security Best Practices: https://auth0.com/docs/security/store-tokens -- External source, verify applicability

---

*Research completed: 2026-04-16*
*Ready for roadmap: conditional -- ARCHITECTURE.md needed before detailed planning*
