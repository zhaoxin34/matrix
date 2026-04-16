# Requirements: Milestone v1.1 Feature Implementation

**Milestone:** v1.1 — Feature Implementation
**Phase:** 4 (Auth) + 5 (Product Catalog)
**Status:** Active
**Generated:** 2026-04-16

---

## v1.0 Requirements (Completed)

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01: Backend project structure | Phase 1 | ✅ Complete |
| ARCH-02: Frontend project structure | Phase 2 | ✅ Complete |
| ARCH-03: Database models defined | Phase 1 | ✅ Complete |
| ARCH-04: Git hooks configured | Phase 1 | ✅ Complete |
| ARCH-05: Backend Makefile | Phase 1 | ✅ Complete |
| ARCH-06: Frontend Makefile | Phase 2 | ✅ Complete |

---

## v1.1 Requirements (Active)

### 1. Authentication (Phase 4)

#### User Registration

- [ ] **AUTH-01**: User can register with phone number and password
  - Phone number format validation (Chinese mobile: 1XX-XXXX-XXXX)
  - Password minimum 8 characters with complexity requirements
  - Terms of service agreement checkbox required
  - Return JWT access token + refresh token on success

- [ ] **AUTH-02**: User receives verification code via SMS for phone verification
  - 6-digit numeric code
  - 5-minute expiration
  - Rate limited to 5 requests per phone per hour

#### User Login

- [ ] **AUTH-03**: User can login with phone number and password
  - Return JWT access token (15-30 min expiry) + refresh token (7-14 days)
  - Failed login tracking (5 attempts = 15 min lockout)
  - Account lockout notification

- [ ] **AUTH-04**: JWT access token refresh mechanism
  - `/auth/refresh` endpoint exchanges valid refresh token for new access token
  - Refresh token rotation (new refresh token issued on each refresh)
  - Refresh token stored in httpOnly cookie or secure storage

- [ ] **AUTH-05**: User logout invalidates tokens
  - Access token blacklisted (if using short-lived tokens)
  - Refresh token deleted from server

#### Password Reset

- [ ] **AUTH-06**: User can request password reset via phone/SMS
  - Generate single-use secure reset token
  - Token expires after 1 hour
  - Rate limited to 3 requests per phone per day

- [ ] **AUTH-07**: User can reset password with valid token
  - Token validated before password change
  - Password complexity requirements enforced
  - Previous password reuse prevention (last 5 passwords)

#### Auth Security

- [ ] **AUTH-08**: Rate limiting on all auth endpoints
  - Login: 5 attempts per IP per 15 minutes
  - Register: 3 attempts per IP per hour
  - Password reset: 3 attempts per phone per day

- [ ] **AUTH-09**: `get_current_user` dependency for protected routes
  - Extracts and validates JWT from Authorization header
  - Returns current user object from database
  - Raises 401 for invalid/expired tokens

- [ ] **AUTH-10**: SECRET_KEY properly secured
  - No hardcoded default in production
  - Startup validation fails if not properly configured
  - Cryptographically secure key generation available

---

### 2. Product Catalog (Phase 5)

#### Category Navigation

- [ ] **CAT-01**: Two-level category hierarchy (L1 → L2)
  - L1 categories displayed on homepage
  - L2 subcategories shown when L1 selected
  - Category tree retrieved from backend

#### Product Listing

- [ ] **PROD-01**: Product listing with pagination
  - Grid layout with image, name, price
  - Default 20 items per page
  - Page navigation (previous/next, page numbers)

- [ ] **PROD-02**: Product detail page
  - Image carousel (up to 8 images)
  - Price display (original + sale price if applicable)
  - Stock status ("In Stock", "Only X left", "Out of Stock")
  - SKU variant selector (color, size, flavor)
  - Product specifications and description

#### Search

- [ ] **PROD-03**: Search products by keyword
  - Database ILIKE search on product name
  - Minimum 2 characters to trigger search
  - Maximum 50 results per query

- [ ] **PROD-04**: Search autocomplete/suggestions
  - Top 10 matching product names as suggestions
  - Debounced input (300ms)
  - Search history (last 5 searches, localStorage)

#### Filtering & Sorting

- [ ] **PROD-05**: Product filtering
  - Filter by brand (multi-select)
  - Filter by price range (min/max input)
  - Filter by stock status (in stock / all)
  - Filters combinable and即时更新

- [ ] **PROD-06**: Product sorting
  - Sort options: Price (low→high), Price (high→low), Sales volume, Newest
  - Single selection at a time
  - Default sort: Relevance/Sales

---

## v1.2+ Requirements (Deferred)

### Shopping Cart (v1.2)

- CART-01: User can add items to cart
- CART-02: User can update quantities
- CART-03: User can remove items

### Order Management (v1.3)

- ORDER-01: User can checkout
- ORDER-02: User can view order history
- ORDER-03: Order status tracking

---

## Out of Scope

| Feature | Reason | Target Phase |
|---------|--------|--------------|
| WeChat OAuth | Third-party integration | v1.2 |
| Guest checkout | Breaks order history | v1.2 |
| Product image upload | Infrastructure needed | v1.2 |
| SKU/SPU variant modeling | Data modeling complexity | v1.2 |
| Email-based password reset | SMS service needed | v1.2 |

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| AUTH-01 | 4 | Pending |
| AUTH-02 | 4 | Pending |
| AUTH-03 | 4 | Pending |
| AUTH-04 | 4 | Pending |
| AUTH-05 | 4 | Pending |
| AUTH-06 | 4 | Pending |
| AUTH-07 | 4 | Pending |
| AUTH-08 | 4 | Pending |
| AUTH-09 | 4 | Pending |
| AUTH-10 | 4 | Pending |
| CAT-01 | 5 | Pending |
| PROD-01 | 5 | Pending |
| PROD-02 | 5 | Pending |
| PROD-03 | 5 | Pending |
| PROD-04 | 5 | Pending |
| PROD-05 | 5 | Pending |
| PROD-06 | 5 | Pending |

**Coverage:**
- v1.1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---

## Dependencies

```
Phase 4 (Auth)
├── Backend: FastAPI + JWT libraries (existing)
├── Frontend: React + Zustand + Axios (existing)
└── Database: User model (existing schema)

Phase 5 (Product Catalog)
├── Backend: Product model + Category model (existing schema)
├── Phase 4: Auth dependency for protected operations
└── Frontend: Product listing/detail pages (existing scaffold)
```

---

## Open Decisions

| Decision | Options | Status |
|----------|---------|--------|
| SMS provider for verification | Aliyun SMS / Tencent SMS / Mock for demo | Pending |
| Image storage | Cloud storage (S3/R2) / Local / External URLs | Pending |

---

*Requirements defined: 2026-04-16*
