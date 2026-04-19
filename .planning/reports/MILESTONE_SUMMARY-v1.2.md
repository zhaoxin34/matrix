# Milestone v1.2 — Project Summary

**Generated:** 2026-04-19
**Purpose:** Team onboarding and project review
**Status:** In Progress — No phases executed yet

---

## 1. Project Overview

**AI Matrix E-commerce Demo Platform**

A simulation testbed for researching AI autonomous decision-making and learning. The e-commerce platform serves as an environment where AI agents can observe business operations, learn from mentor-student interactions, and eventually operate independently to maximize ROI.

**Current Milestone:** v1.2 — Shopping Cart & Checkout (Phase 6 & 7)
**Status:** Not Started — Phases pending execution

### Core Value

Establish a robust, evolvable architecture that enables rapid iteration on AI research while providing realistic business simulation data.

### Constraints

- **Tech Stack:** Python FastAPI + React TypeScript
- **Database:** MySQL
- **No Real Payments:** Demo only
- **Architecture:** Must support future AI agent integration

---

## 2. Architecture & Technical Decisions

*(Inherited from v1.1 — no new decisions for v1.2 yet)*

- **Frontend:** React 18 + TypeScript + Vite + Zustand (state) + Axios (HTTP) + Ant Design 5 (UI)
- **Backend:** FastAPI with layered architecture (API → Service → Repository)
- **Auth:** Custom JWT implementation (not fastapi-users) for AI agent observability
  - Access tokens: 30 min expiry
  - Refresh tokens: 7 days
- **Database:** MySQL with SQLAlchemy 2.0 ORM
- **分层架构:** Separation enables AI to understand/intercept business logic

---

## 3. Phases Delivered

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| 6 | Shopping Cart | ⏳ Pending | Add to cart, update quantities, remove items |
| 7 | Order Management | ⏳ Pending | Checkout, order history, order status |

**Note:** No phase directories exist yet. This milestone is ready to begin execution.

---

## 4. Requirements Coverage

### Phase 6: Shopping Cart (Pending)

| Requirement | Status |
|-------------|--------|
| CART-01: User can add items to cart | ⏳ Not started |
| CART-02: User can update quantities | ⏳ Not started |
| CART-03: User can remove items | ⏳ Not started |

### Phase 7: Order Management (Pending)

| Requirement | Status |
|-------------|--------|
| ORDER-01: User can checkout | ⏳ Not started |
| ORDER-02: User can view order history | ⏳ Not started |
| ORDER-03: Order status tracking | ⏳ Not started |

---

## 5. Key Decisions Log

*(No new decisions for v1.2 yet — Phase 6 not started)*

### Prior Milestone Decisions (v1.1)

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Custom JWT auth over fastapi-users | AI agent observability - can intercept/understand auth flow | Phase 4 |
| SMS mocked for demo | Real SMS integration deferred to v1.2 | Phase 4 |
| L1/L2 category hierarchy | Two-level nav for clean UX + AI simulation simplicity | Phase 5 |
| Ant Design 5 | Fast development, consistent UI | Phase 2 |
| Zustand for state | Lightweight, TypeScript-friendly | Phase 2 |
| SlowAPI for rate limiting | Starlette-native, simple integration | Phase 4 |

---

## 6. Tech Debt & Deferred Items

### From Prior Milestones

- **Database required for full API testing:** Backend requires MySQL with seeded data. UAT testing blocked until DB is set up.
- **SMS mocked:** Prints to console, not real SMS provider — real SMS deferred to future milestone

### v1.2 Scope

- Shopping cart functionality
- Order management / checkout
- Real SMS provider integration (if time permits)

### Deferred to Future Milestones

- CDP platform
- User behavior simulator
- Agent communication platform
- Real payment integration

### Notes

- MySQL running at `mysql -u root -proot -h 127.0.0.1`
- Redis available for caching
- Frontend dev server: port 3000
- Backend API: port 8000

---

## 7. Getting Started

### Run the Project

```bash
# Backend
cd ecommerce/backend
pip install -r requirements.txt
make dev  # Runs on port 8000

# Frontend
cd ecommerce/frontend
npm install
npm run dev  # Runs on port 3000
```

### Key Directories

```
ecommerce/
├── backend/src/app/
│   ├── api/v1/        # API routes (auth, products, categories, etc.)
│   ├── services/      # Business logic
│   ├── repositories/ # Data access
│   ├── models/       # SQLAlchemy models
│   └── schemas/      # Pydantic schemas
└── frontend/src/
    ├── pages/        # React pages
    ├── components/   # Reusable UI components
    ├── hooks/        # Custom React hooks
    ├── stores/       # Zustand state stores
    └── api/          # Axios API clients
```

### Tests

```bash
# Backend
cd ecommerce/backend && make lint test

# Frontend
cd ecommerce/frontend && npm run lint type-check test
```

### Where to Look First

- **Backend entry:** `ecommerce/backend/src/app/main.py`
- **Frontend entry:** `ecommerce/frontend/src/main.tsx`
- **Cart API scaffold:** `ecommerce/backend/src/app/api/v1/` (cart endpoints expected)
- **Cart page scaffold:** `ecommerce/frontend/src/pages/` (cart page expected)

---

## Stats

- **Timeline:** 2026-04-19 (in progress)
- **Phases:** 0/2 complete (not started)
- **Commits since v1.1:** 8 (fixes and e2e tests)
- **Files changed:** ~20 (+800 / -200)
- **Contributors:** Claude (AI), User (human)

---

*This milestone is in progress. Run `/gsd-progress` to check current state or `/gsd-next` to begin Phase 6.*
