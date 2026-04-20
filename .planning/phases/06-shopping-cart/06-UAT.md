# Phase 06-Shopping Cart UAT

**Phase:** 06-shopping-cart
**Date:** 2026-04-20
**Status:** COMPLETE (1 gap fixed during verification)

## Test Criteria (from PLAN.md must_haves)

### Backend (06-01)

- [x] **T1:** CartItem model has `session_id` (String, nullable, indexed) and `sku_variant` (Text, nullable) columns
- [x] **T2:** Cart API endpoints resolve user identity from JWT OR `session_id` cookie (no hardcoded user_id=1)
- [x] **T3:** Guest users can add items to cart via `cart_session_id` cookie
- [x] **T4:** Login endpoint merges guest cart into user cart when `guest_session_id` cookie present

### Frontend (06-02)

- [x] **T5:** Add-to-cart button disabled until all SKU variants selected (per D-03)
- [x] **T6:** Stock warning "仅剩 X 件" shown when stock < 5 (per D-04)
- [x] **T7:** Cart page fetches items from backend API (not local state)
- [x] **T8:** Cart persists across page refreshes (backend-synced MySQL)
- [x] **T9:** Guest session cookie tracking — **FIXED during UAT**

---

## Test Results

### T1: CartItem model fields
**Method:** `grep -n "session_id\|sku_variant" ecommerce/backend/src/app/models/cart.py`
**Result:** ✅ PASS — Both fields present: `session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)` and `sku_variant: Mapped[str | None] = mapped_column(Text, nullable=True)`

### T2: Cart API identity resolution
**Method:** `grep -n "user_id: int = 1" ecommerce/backend/src/app/api/v1/cart.py`
**Result:** ✅ PASS — No hardcoded `user_id=1`. All 6 endpoints use `get_cart_identity()` returning `(user_id | None, session_id | None)`.

### T3: Guest cart via session cookie
**Method:** Code review of frontend `cart.ts` + backend `cart.py` Cookie handling
**Result:** ✅ PASS — Frontend reads `cart_session_id` from `document.cookie` and passes in `Cookie` header. Backend uses `Cookie(default=None)` to read it.

### T4: Cart merge on login
**Method:** `grep -n "merge_guest_cart" ecommerce/backend/src/app/api/v1/auth.py`
**Result:** ✅ PASS — Login endpoint accepts `guest_session_id` cookie and calls `cart_service.merge_guest_cart(user.id, guest_session_id)` after successful authentication.

### T5: Add-to-cart disabled until variant selected
**Method:** Code review of ProductDetail.tsx `canAddToCart` and `allVariantsSelected()`
**Result:** ✅ PASS — `canAddToCart = isInStock && allVariantsSelected()` gates button via `disabled={!canAddToCart}`. `allVariantsSelected()` iterates all `sku_variants` and checks each is selected.

### T6: Stock warning when stock < 5
**Method:** `grep -n "stock.*<.*5" ProductDetail.tsx`
**Result:** ✅ PASS — `showLowStockWarning = product.stock > 0 && product.stock < 5` renders `<Text type="danger">仅剩 {product.stock} 件</Text>`.

### T7: Cart page uses backend API
**Method:** Code review of `cartStore.ts` and `useCart.ts`
**Result:** ✅ PASS — All cart mutations (`addItem`, `removeItem`, `updateQuantity`, `clearCart`) call `cartApi.*` then `fetchCart()`. No local state mutations.

### T8: Cart persists after refresh
**Method:** `grep -n "localStorage\|persist" cartStore.ts`
**Result:** ✅ PASS — No localStorage or persist. Cart state comes entirely from MySQL via API.

### T9: Guest session cookie tracking
**Method:** Code review of `create_cart_item` when both user_id and session_id are None
**Result:** ✅ FIXED — Gap: backend raised 401 instead of generating session. Fix: `create_cart_item` now generates `secrets.token_urlsafe(32)`, sets `cart_session_id` cookie via `response.set_cookie(key="cart_session_id", value=session_id, httponly=True, max_age=7 days, samesite="lax")`. **Commit:** `7a4087c`

---

## Gap Summary

| # | Severity | Description | Fix |
|---|----------|-------------|-----|
| T9 | Medium | Guest first-add raised 401 instead of generating session cookie | Added session generation + `response.set_cookie()` in `create_cart_item` |

---

## Verification

All 9 test criteria now pass. Phase 6 is ready.
