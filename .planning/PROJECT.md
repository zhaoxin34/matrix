# AI Matrix - E-commerce Demo Platform

## What This Is

A simulation testbed for researching AI autonomous decision-making and learning. The e-commerce platform (demo site + CDP) serves as an environment where AI agents can observe business operations, learn from mentor-student interactions, and eventually operate independently to maximize ROI.

## Core Value

Establish a robust, evolvable architecture that enables rapid iteration on AI research while providing realistic business simulation data.

## Current State

**Shipped Version:** v1.1 — Feature Implementation ✅

**What's Working:**
- User registration with phone + password
- JWT authentication (login, logout, token refresh)
- Password reset via SMS (mocked)
- Rate limiting on auth endpoints
- Product catalog with L1/L2 category hierarchy
- Product listing with pagination (20/page)
- Product detail with image carousel, SKU selector
- Search with autocomplete (300ms debounce)
- Filter by brand, price range, stock status
- Sort by price, sales, newest

**What's Blocked:**
- Full UAT testing requires MySQL database setup with seeded data
- Backend API endpoints return 500 without database

## Requirements

### Validated

- [x] E-commerce platform architecture established (backend + frontend scaffolding)
- [x] Engineering workflows operational (git hooks, lint, format, type-check, test)
- [x] Database schema designed and migrations ready
- [x] User authentication (login, register, password reset, JWT tokens)
- [x] Product catalog (browsing, search, filter)

### Active

- [ ] Shopping cart (add, update, remove items)
- [ ] Order management (checkout, order history)

### Out of Scope

- CDP platform
- User behavior simulator
- Agent communication platform
- Real payment integration
- Real SMS integration

## Next Milestone: v1.2 — Shopping Cart & Checkout

**Goal:** Users can manage shopping cart and complete checkout

**Target features:**
- Shopping cart (add items, update quantities, remove items)
- Checkout flow with address selection
- Order history and status tracking

## Context

**AI Research Goal:** Create a mentor-student AI architecture where:
- Mentor agent: Expert in e-commerce operations (knows when/what to do)
- Student agent: Observes mentor, experiments in simulation, learns decision-making
- CDP: Control panel the AI uses to take actions and gather data

**Current Phase Focus:** v1.2 Shopping Cart & Checkout (Phase 6: Cart, Phase 7: Orders)

**Infrastructure Available:**
- MySQL: `mysql -u root -proot -h 127.0.0.1` (already running)
- Redis: available for caching (already running)
- Chrome MCP: available for service verification

## Constraints

- **Tech Stack:** Python FastAPI + React TypeScript (per project prompts)
- **Database:** MySQL (not SQLite — aligns with prompts spec)
- **Architecture:** Must support future AI agent integration
- **No Real Payments:** Demo only, no actual payment processing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Phase 1 = Architecture only | Stable foundation enables faster iteration on features later | ✅ Validated |
| MySQL over SQLite | Per project prompts spec; better for concurrent access simulation | ✅ Validated |
| 分层架构 (API→Service→Repo) | Separation enables AI to understand/intercept business logic | ✅ Validated |
| Custom JWT auth | AI agent observability - can intercept/understand auth flow | ✅ Validated |
| Ant Design 5 | Fast development, consistent UI | ✅ Validated |
| L1/L2 category hierarchy | Two-level nav for clean UX + AI simulation simplicity | ✅ Validated |
| SMS mocked for demo | Real SMS integration deferred to v1.2 | ✅ Validated |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

*Last updated: 2026-04-16 after v1.1 milestone completion*
