# Phase 6: Shopping Cart - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 06-shopping-cart
**Mode:** discuss
**Areas discussed:** Cart persistence, Auth-gated cart, Add-to-cart UX, Stock validation

---

## Cart Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Backend-synced | Cart in MySQL, survives refresh, AI agents can observe | ✓ |
| Client-side only | Zustand + localStorage, simpler but lost on clear | |

**User's choice:** Backend-synced
**Rationale:** Aligns with AI research goal — agents need persistent cart observation

---

## Auth-Gated Cart

| Option | Description | Selected |
|--------|-------------|----------|
| Guest cart + merge on login | Anyone can add to cart. On login, carts merge. | ✓ |
| Login required | Must authenticate first. Simpler but more friction. | |

**User's choice:** Guest cart + merge on login
**Rationale:** Reduces friction for demo while preserving data continuity

---

## Add-to-Cart UX

| Option | Description | Selected |
|--------|-------------|----------|
| Require SKU selection | Must pick color/size first. More control. | ✓ |
| Single-click add | Add default variant immediately. Simpler. | |

**User's choice:** Require SKU selection
**Rationale:** Product detail page has SKU selector — users should select before adding

---

## Stock Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Warn on add | Show warning if low stock when adding | ✓ |
| Block on add | Prevent adding if insufficient stock | |
| Validate at checkout only | Only check when user proceeds to pay | |

**User's choice:** Warn on add
**Rationale:** Shows "Only X left in stock" warning when stock < 5

---

## Decisions Captured

1. **Cart Persistence:** Backend-synced (MySQL)
2. **Auth-Gated Cart:** Guest cart with merge on login
3. **Add-to-Cart UX:** Require SKU selection before adding
4. **Stock Validation:** Warn on add when stock < 5

