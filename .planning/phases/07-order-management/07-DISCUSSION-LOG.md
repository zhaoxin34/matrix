# Phase 7: Order Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 07-order-management
**Areas discussed:** Guest Checkout, Address Model, Order Status Flow, Inventory Deduction

---

## Guest Checkout

| Option | Description | Selected |
|--------|-------------|----------|
| Allow guest checkout (Recommended) | Guests can checkout with address info. Order linked to session_id. Guest can optionally register/login after to claim order. | ✓ |
| Require login to checkout | Must be logged in to place an order. Prompt login/signup from checkout page. | |
| Guest checkout with email only | Guest provides email to checkout, no account needed but order tied to email for lookup. | |

**User's choice:** Allow guest checkout (Recommended)
**Notes:** Guest checkout allowed. Orders linked to session_id. Guest can optionally register/login after to claim order.

---

## Address Model

| Option | Description | Selected |
|--------|-------------|----------|
| Create Address model (Recommended) | New Address table in MySQL. Users can save multiple addresses. Checkout saves address and links via address_id. More complex but realistic. | ✓ |
| Embed in Order directly | No Address table. Address fields stored directly on Order. Simpler, but no address book. | |
| Address model + guest fallback | Address model for logged-in users. Guests get address embedded on order (no saved address). Hybrid approach. | |

**User's choice:** Create Address model (Recommended)
**Notes:** Full Address model with CRUD for logged-in users. Guest checkout stores address directly with order.

---

## Order Status Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-confirm on checkout (Recommended) | Order goes directly to 'paid' status on checkout (instant, no real payment). Shipped/delivered are manual admin states. Simplest for demo. | ✓ |
| Pending → Paid manually | Order created as 'pending'. User must click 'Pay now' button (mock) to transition to 'paid'. More steps but realistic flow. | |
| Pending only | All orders stay 'pending'. No payment or shipping states. | |

**User's choice:** Auto-confirm on checkout (Recommended)
**Notes:** Order created with status="paid" immediately. No pending state. Admin updates shipped/delivered.

---

## Inventory Deduction

| Option | Description | Selected |
|--------|-------------|----------|
| Deduct on order creation (Recommended) | Stock decremented immediately when order is placed. Aligns with 'paid' = order created. Simple and consistent with auto-confirm. | ✓ |
| Deduct on payment confirmation | Stock decremented only when payment confirmed. | |
| No stock deduction | Stock is informational only. | |

**User's choice:** Deduct on order creation (Recommended)
**Notes:** Stock decremented immediately when order placed.

---

## Auto-Resolved

No auto-resolved items — all decisions made interactively.

## External Research

No external research needed — all decisions based on codebase patterns and prior phase context.

---

*Phase: 07-order-management*
*Discussion completed: 2026-04-20*
