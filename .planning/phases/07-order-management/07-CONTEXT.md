# Phase 7: Order Management - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can checkout from cart and view order history. Order is created from cart items, address is selected/created, stock is deducted, and order appears in user history. Guest users can checkout without logging in.

**Requirements:** ORDER-01 (checkout), ORDER-02 (order history), ORDER-03 (order status tracking)
**Depends on:** Phase 6 (Shopping Cart)

</domain>

<decisions>
## Implementation Decisions

### Guest Checkout
- **D-01:** Guest checkout allowed — no login required to place order
- Order linked to session_id cookie for guest users
- Guest can optionally register/login after checkout to claim the order
- Session ID stored on Order model alongside user_id

### Address Model
- **D-02:** Create Address model in MySQL — users can save multiple addresses
- Address fields: recipient_name, phone, province, city, district, street
- Logged-in users: address linked to user_id, can CRUD saved addresses
- Guest users: address stored with order directly (not persisted to address table), linked via session_id
- Checkout: user selects a saved address or enters new address (saved if logged in)
- OrderCreate schema uses address_id to link to Address model

### Order Status Flow
- **D-03:** Auto-confirm on checkout — order created with status="paid" immediately
- No pending state, no separate payment step (PROJECT.md: "No Real Payments")
- Status lifecycle: paid → shipped → delivered (admin updates shipped/delivered)
- Cancelled state available for admin or refund scenarios
- Status transitions: paid can go to shipped; any state can go to cancelled

### Inventory Deduction
- **D-04:** Deduct stock on order creation — product.stock decremented immediately when order placed
- Quantity deducted = cart item quantity
- If product has SKU variants, deduct from the specific variant stock (if tracked)
- Stock check before order: if stock insufficient, return error and block order

### Order Creation Flow
- **D-05:** Checkout converts cart items to order items — cart items read, order created with order items, cart cleared
- Order total calculated server-side from product prices (not from frontend)
- Each order item stores: product_id, quantity, unit_price (snapshot at order time)
- Guest cart cleared after order creation (existing Phase 6 behavior)

### Order Identity Resolution
- **D-06:** Order API uses same identity resolution as cart — JWT user_id OR session_id cookie
- Logged-in users: orders via user_id
- Guest users: orders via session_id (can be claimed on login)
- On login: if guest has session_id orders, optionally prompt to merge/claim them

</decisions>

<specifics>
## Specific Ideas

- Checkout page (`/checkout`) — 3-step: Confirm cart → Address → Done
- Address selection UI — dropdown of saved addresses + "Add new address" option
- Order confirmation page — shows order number, items, total, address
- Order history page (`/orders`) — Table of past orders, click to view detail
- "My orders" link in header navigation (logged in only)

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### E-commerce Backend
- `ecommerce/backend/src/app/models/order.py` — Order model (needs session_id, address_id)
- `ecommerce/backend/src/app/models/order_item.py` — OrderItem model (snapshot of price)
- `ecommerce/backend/src/app/models/cart.py` — CartItem model (cart→order conversion)
- `ecommerce/backend/src/app/api/v1/orders.py` — Orders API (needs auth/session resolution)
- `ecommerce/backend/src/app/services/order_service.py` — OrderService (needs cart→order conversion)
- `ecommerce/backend/src/app/repositories/order_repo.py` — OrderRepository

### E-commerce Frontend
- `ecommerce/frontend/src/pages/Checkout.tsx` — Checkout page (needs address selection + API integration)
- `ecommerce/frontend/src/pages/OrderList.tsx` — Order history (needs API integration)
- `ecommerce/frontend/src/hooks/useCart.ts` — Cart hook (for cart→order flow)
- `ecommerce/frontend/src/stores/cartStore.ts` — Cart store (for cart→order flow)

### Planning Artifacts
- `.planning/ROADMAP.md` — Phase 7 requirements (ORDER-01, ORDER-02, ORDER-03)
- `.planning/phases/06-shopping-cart/06-CONTEXT.md` — Cart context (guest checkout, session_id, sku_variant)
- `.planning/milestones/v1.1-REQUIREMENTS.md` — Order requirements

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- **Order/OrderItem models** — Already scaffolded from Phase 1, needs session_id, address_id
- **Cart → Order conversion** — CartService already has get_cart_total; needs extension for order creation
- **Checkout.tsx** — Ant Design Form with address fields exists, needs real API + address selection
- **OrderList.tsx** — Ant Design Table with status badges, needs real API data

### Established Patterns
- **API → Service → Repository** — Backend layered architecture
- **JWT auth with session cookie** — Same pattern from auth and cart phases
- **Ant Design 5** — UI component library
- **Zustand store** — Frontend state management

### Integration Points
- **Order API** needs `get_cart_identity()` pattern (same as cart.py) for user_id/session_id
- **Checkout** connects to cart (read items), order API (create), address API (select/create)
- **Cart store** clearCart() called after successful order creation
- **OrderList** fetches from GET /orders with pagination

### Technical Gaps to Fill
- No Address model exists yet — must be created
- No address API routes exist yet
- Order.create() currently hardcodes user_id=1 — needs auth/session resolution
- No stock deduction on order creation
- Product model has stock field but no variant-level stock tracking

</codebase_context>

<deferred>
## Deferred Ideas

### Future Phases
- Real payment integration (Stripe, etc.) — v1.3+
- Admin order management page — separate phase
- Order cancellation by user (not just admin) — v1.3+
- Shipment tracking integration — v1.3+
- Email notification on order status change — v1.3+

### Variant-Level Stock
- Product variant stock tracking (color/size specific) not implemented in this phase
- Products have sku_variants but stock is at product level only

</deferred>

---

*Phase: 07-order-management*
*Context gathered: 2026-04-20*
