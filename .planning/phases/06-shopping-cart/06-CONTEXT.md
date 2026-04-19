# Phase 6: Shopping Cart - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can manage shopping cart items: add products, update quantities, remove items. Cart persists across sessions via backend storage. Guest users can add items; cart merges with user account on login.

**Requirements:** CART-01, CART-02, CART-03

</domain>

<decisions>
## Implementation Decisions

### Cart Persistence
- **D-01:** Backend-synced cart — cart data stored in MySQL, not client-side only
- Cart state persists across browser sessions
- AI agents can observe and track cart state for simulation
- Enables accurate ROI calculation and cart abandonment analysis

### Auth-Gated Cart
- **D-02:** Guest cart allowed — users can add items without logging in
- Cart identified by session ID for anonymous users
- On login: guest cart merges with existing user cart (if any)
- `user_id` in cart identified via session token (not hardcoded to `1`)

### Add-to-Cart UX
- **D-03:** Require SKU variant selection before adding to cart
- Product detail page has SKU selector (color, size, etc.)
- "Add to Cart" button disabled until variant is selected
- Selected variant stored with cart item

### Stock Validation
- **D-04:** Warn on add — show "Only X left in stock" when stock < 5
- Low stock warning appears near quantity input and add-to-cart button
- Does not block adding (user can still add if they choose)
- Real stock check happens at checkout

### Cart Data Model
- **D-05:** Cart identified by `user_id` or `session_id` (for guests)
- Each cart item links to `product_id` and selected `sku_variant` (JSON)
- Cart total calculated server-side from product prices

### Cart Merge Behavior
- **D-06:** On login, merge guest cart with user cart
- If same product exists in both, quantities add together
- Guest cart cleared after successful merge

</decisions>

<specifics>
## Specific Ideas

- "Add to Cart" button on product detail page — prominent, near price
- Cart icon in header shows item count badge
- Cart page (`/cart`) shows items in Ant Design Table
- Quantity input with +/- buttons, max = stock level
- "Continue shopping" and "Checkout" CTAs

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### E-commerce Backend
- `ecommerce/backend/src/app/models/cart.py` — CartItem model
- `ecommerce/backend/src/app/models/user.py` — User model with cart relationship
- `ecommerce/backend/src/app/services/cart_service.py` — CartService (needs session_id support)
- `ecommerce/backend/src/app/api/v1/cart.py` — Cart API routes (needs auth integration)
- `ecommerce/backend/src/app/schemas/cart.py` — Cart schemas

### E-commerce Frontend
- `ecommerce/frontend/src/pages/Cart.tsx` — Cart page (needs backend integration)
- `ecommerce/frontend/src/stores/cartStore.ts` — Zustand store (needs API sync)
- `ecommerce/frontend/src/hooks/useCart.ts` — Cart hook
- `ecommerce/frontend/src/pages/ProductDetail.tsx` — Add to cart integration point

### Planning Artifacts
- `.planning/ROADMAP.md` — Phase 6 requirements (CART-01, CART-02, CART-03)
- `.planning/milestones/v1.1-REQUIREMENTS.md` — v1.1 auth requirements (for JWT integration reference)

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- **Cart model/service/routes** — Already scaffolded from Phase 1, needs auth integration and session_id support
- **Product detail page** — Has SKU selector, needs "Add to Cart" button integration
- **Cart page** — Ant Design Table layout exists, needs API integration
- **Zustand store** — `cartStore.ts` exists but is client-side only

### Established Patterns
- **API → Service → Repository** — Backend follows layered architecture
- **Zustand + localStorage** — Frontend state pattern (per Phase 2)
- **Ant Design 5** — UI component library (per Phase 2, 5)
- **JWT auth with session** — Already implemented in Phase 4

### Integration Points
- **Cart API** needs `get_current_user` dependency (currently hardcoded `user_id = 1`)
- **Cart API** needs session_id support for guest users
- **Product detail page** needs "Add to Cart" button connected to cart store
- **Cart store** needs backend sync (currently purely client-side)

</codebase_context>

<deferred>
## Deferred Ideas

### Phase 7: Order Management
- Checkout flow
- Address selection
- Order history

### Future: Cart Persistence for AI
- Cart events should emit to event bus for AI agent observation
- This enables "cart abandonment" simulation and mentor-student learning

</deferred>

---

*Phase: 06-shopping-cart*
*Context gathered: 2026-04-20*
