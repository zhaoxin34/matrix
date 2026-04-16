# Pitfalls Research

**Domain:** User Authentication and Product Catalog for FastAPI + React E-commerce
**Researched:** 2026-04-16
**Confidence:** MEDIUM

Based on codebase analysis of `ecommerce/backend` and `ecommerce/frontend`, plus common e-commerce platform pitfalls.

## Critical Pitfalls

### Pitfall 1: No Refresh Token Mechanism

**What goes wrong:**
Users get logged out every 30 minutes (ACCESS_TOKEN_EXPIRE_MINUTES). This causes poor UX as users must re-authenticate frequently, especially during long browsing sessions.

**Why it happens:**
The current implementation only issues short-lived access tokens with no refresh token rotation. This is a common oversight when implementing JWT auth.

**How to avoid:**
Implement refresh token pattern:
- Issue short-lived access tokens (15-30 min)
- Issue longer-lived refresh tokens (7-14 days) stored in httpOnly cookies or secure storage
- Add `/auth/refresh` endpoint to exchange refresh token for new access token
- Store refresh token hash in database for revocation capability

**Warning signs:**
- Users reporting unexpected logouts
- High bounce rate on product pages
- Low session duration metrics

**Phase to address:**
Phase 4 (Auth) - Implement before production deployment

---

### Pitfall 2: Hardcoded SECRET_KEY in Config

**What goes wrong:**
The `SECRET_KEY: str = "your-secret-key-change-in-production"` default is checked into version control. If this leaks, attackers can forge valid JWT tokens and gain full access.

**Why it happens:**
Developers add defaults for convenience during development and forget to enforce proper environment configuration.

**How to avoid:**
1. Remove default value: `SECRET_KEY: str` (no default)
2. Add validation that fails startup if SECRET_KEY is not set in production
3. Use `pydantic-settings` with `env_file = ".env"` and require `.env` for production
4. Generate cryptographically secure keys: `openssl rand -hex 32`

**Warning signs:**
- `git log` shows SECRET_KEY in commits
- `.env` file in repository
- No startup validation of secret key strength

**Phase to address:**
Phase 4 (Auth) - Critical security fix before any deployment

---

### Pitfall 3: No Rate Limiting on Auth Endpoints

**What goes wrong:**
Login and register endpoints are vulnerable to brute force attacks. An attacker can try thousands of password combinations per minute to crack user accounts.

**Why it happens:**
Rate limiting is often overlooked during initial auth implementation since the app works fine with a single user.

**How to avoid:**
Add rate limiting middleware:
```python
# Using slowapi or similar
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
```

Also implement:
- Account lockout after N failed attempts (e.g., 5 failed logins = 15 min lockout)
- Progressive delays between attempts
- CAPTCHA after 3 failed attempts

**Warning signs:**
- Multiple 401 responses from same IP
- Sudden spike in failed login attempts
- Alerting from security monitoring

**Phase to address:**
Phase 4 (Auth) - Essential before any public deployment

---

### Pitfall 4: Missing Current User Dependency

**What goes wrong:**
Protected endpoints (cart, orders, profile) have no way to identify the current user. The `dependencies.py` has `get_database` but no `get_current_user`. All product endpoints are currently public, which is correct, but future cart/order endpoints will be inaccessible.

**Why it happens:**
Auth scaffolding was started but not completed. The JWT decode function exists but isn't wired into FastAPI's dependency system.

**How to avoid:**
Implement proper current user dependency:
```python
# dependencies.py
async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    credentials = request.headers.get("Authorization")
    if not credentials:
        raise UnauthorizedException("Missing authorization header")

    token = credentials.replace("Bearer ", "")
    payload = decode_access_token(token)
    if not payload:
        raise UnauthorizedException("Invalid token")

    user = user_repo.get_by_id(payload["user_id"])
    if not user:
        raise UnauthorizedException("User not found")
    return user
```

Then use in routes:
```python
@router.post("/cart")
async def add_to_cart(
    cart_data: CartCreate,
    current_user: User = Depends(get_current_user)
):
    # current_user is guaranteed valid
```

**Warning signs:**
- No `get_current_user` function in dependencies.py
- Protected routes accepting user_id as request body (security flaw)
- Any endpoint that modifies user data without token validation

**Phase to address:**
Phase 4 (Auth) - Must be complete before cart/order features

---

### Pitfall 5: Password Reset Not Implemented

**What goes wrong:**
Users who forget passwords cannot recover their accounts. The PROJECT.md specifies "password reset" as a requirement but no implementation exists. This blocks the auth feature from being complete.

**Why it happens:**
Password reset is complex (email integration, token generation, secure tokens, expiration) so it's often deferred.

**How to avoid:**
Implement secure password reset flow:
1. Add `password_reset_token` and `password_reset_expires` fields to User model
2. Create `/auth/forgot-password` endpoint that generates secure random token (not JWT)
3. Send email with reset link containing token
4. Create `/auth/reset-password` endpoint that validates token and updates password
5. Single-use tokens (delete after successful reset)
6. Token expiration (1 hour is standard)

**Warning signs:**
- User table has no password reset fields
- No forgot-password endpoint
- No email service integration

**Phase to address:**
Phase 4 (Auth) - Required for MVP completeness

---

### Pitfall 6: Frontend/Backend Product Schema Mismatch

**What goes wrong:**
Frontend `Product` type has `images: string[]` but backend `Product` model has no images field. This causes:
- Runtime errors when displaying products
- TypeScript errors if strict type checking
- Broken image galleries

**Why it happens:**
Frontend and backend developed with different specifications. PRD mentions product images (carousel with up to 8 images) but database model was not updated to match.

**How to avoid:**
1. Add images field to Product model:
```python
images: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
```
2. Update schemas to include images
3. Add image upload endpoint (to cloud storage or local)
4. Validate image URLs reference valid resources

**Warning signs:**
- TypeScript errors about missing images property
- Console errors about undefined images
- Empty image gallery on product detail page

**Phase to address:**
Phase 5 (Product Catalog) - Required for product display to work

---

### Pitfall 7: No Product Search Functionality

**What goes wrong:**
The PRD specifies "智能搜索" (smart search) with keyword autocomplete, search suggestions, and 90%+ search hit rate. Current implementation only supports listing by category. Users cannot find products by name, leading to poor conversion.

**Why it happens:**
Basic CRUD is implemented first. Search is more complex and deferred.

**How to avoid:**
Implement search early (don't wait for "smart" search):
1. Database-level search using ILIKE or full-text search:
```python
# product_repo.py
def search(self, query: str, limit: int = 20):
    return self.db.query(Product).filter(
        Product.name.ilike(f"%{query}%")
    ).limit(limit).all()
```
2. Add `/products/search?q=` endpoint
3. Add basic autocomplete endpoint returning top 10 matches
4. Track search queries for future "smart" improvements

**Warning signs:**
- Users complaining cannot find products by name
- High bounce rate on search result pages
- No search endpoint in products.py

**Phase to address:**
Phase 5 (Product Catalog) - Core usability feature

---

### Pitfall 8: No SKU/SPU Distinction

**What goes wrong:**
The PRD distinguishes between SKU (specific variant like "330ml罐装") and SPU (product like "可口可乐"). Current Product model treats all variants as single products. This causes:
- Cannot track stock per variant
- Cannot show price differences for different sizes/flavors
- Inventory management problems

**Why it happens:**
SKU/SPU is an e-commerce complexity that adds significant data modeling work.

**How to avoid:**
Plan for SKU expansion early:
1. Add `sku` field to Product model for variant identification
2. Add `parent_id` field for SPU-SKU relationships
3. Or create separate ProductVariant model
4. Track stock at SKU level, aggregate to SPU for display

**Warning signs:**
- Multiple products with same name but different sizes showing as unrelated
- No variant selection UI
- Stock showing same for all variants

**Phase to address:**
Phase 5 (Product Catalog) - If variants are in scope, model now

---

### Pitfall 9: Missing Input Validation on Product Endpoints

**What goes wrong:**
Product endpoints accept any numeric values without validation:
- Negative prices accepted (should be rejected)
- Negative stock accepted (could cause overselling)
- Extremely large page_size (could cause memory issues)
- No max length on string fields

**Why it happens:**
Pydantic schemas are basic and FastAPI defaults are permissive.

**How to avoid:**
Strengthen validation in schemas:
```python
class ProductCreate(BaseCreate):
    name: str = Field(..., min_length=1, max_length=200)
    price: float = Field(..., gt=0)  # greater than 0
    stock: int = Field(default=0, ge=0)  # greater or equal 0
```

Also add max page_size enforcement:
```python
page_size: int = Query(20, ge=1, le=50)  # cap at 50
```

**Warning signs:**
- Negative price products in database
- page_size=10000 causing slow responses
- Missing validation errors in API responses

**Phase to address:**
Phase 5 (Product Catalog) - Security and stability

---

### Pitfall 10: No Product Image Upload Mechanism

**What goes wrong:**
PRD requires product carousel with up to 8 images per product, but no upload mechanism exists. Product images would need to be set via database directly or external URLs.

**Why it happens:**
File upload requires additional infrastructure (storage, CDN, image processing) and is often deferred.

**How to avoid:**
Plan for image infrastructure:
1. Use cloud storage (AWS S3, Cloudflare R2, or MinIO for local)
2. Implement signed URL uploads:
```
POST /upload/presign  # Returns presigned URL
POST /products/{id}/images  # Save returned image URL
```
3. Or use base64 encoding for MVP (simpler but not scalable)
4. Add image processing (resize, compress) via sharp or similar

**Warning signs:**
- No image upload endpoints
- images field must be populated manually
- No image CDN or storage service configured

**Phase to address:**
Phase 5 (Product Catalog) - Required for product display per PRD

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip refresh tokens | Simpler auth flow | Poor UX, frequent re-login | MVP only, must add before launch |
| Store images as external URLs | No upload code needed | Images can break, no control | MVP only, real upload later |
| Single Product model (no SKU) | Simpler data model | Can't handle product variants | If no variants in scope |
| No search endpoint | Fewer endpoints to maintain | Users can't find products | MVP only, search before launch |
| Hardcoded SECRET_KEY default | Works without .env | Security vulnerability | NEVER in production |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| React + FastAPI | Storing JWT in localStorage | Use httpOnly cookies or memory storage with refresh |
| Frontend product type | Mismatch with backend schema | Shared TypeScript types from backend OpenAPI schema |
| Axios interceptor | Double logging on 401 | Check if already redirecting before logout |
| Database connection | Connection pool exhaustion | Configure pool size, implement proper session cleanup |
| Redis (for caching) | Cache invalidation on partial updates | Use cache-aside pattern with TTL |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries on product list | Slow page loads, many DB queries | Use eager loading for relationships | At 100+ products |
| No pagination | Memory exhaustion | Always paginate, max page_size | At 1000+ products |
| Full table scans for search | 10+ second search times | Add database indexes, use ILIKE wisely | At 10k+ products |
| Synchronous image loading | Slow page render | Lazy load images, use CDN | Any significant traffic |
| No query caching | High DB load | Cache frequent queries in Redis | At moderate traffic |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| No rate limiting on auth | Brute force attacks | Add rate limiter middleware |
| Password in plain text logs | Credential exposure | Never log passwords, hash comparison |
| User ID in request body | Horizontal privilege escalation | Always get user from token, not request |
| No CORS configuration | Cross-origin attacks | Configure allowed origins explicitly |
| No input sanitization | SQL injection / XSS | Use ORM, validate inputs, escape output |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading states | User thinks app is broken | Skeleton screens, spinners |
| No error recovery | User stuck on error | Clear error messages with actions |
| Missing auth redirect | User loses context | Preserve intended destination |
| No empty states | Confusing UI | Friendly messages with actions |
| Slow search | User abandons | Debounced input, instant results |

---

## "Looks Done But Isn't" Checklist

- [ ] **Auth:** JWT token issues but no refresh mechanism - verify `/auth/refresh` exists
- [ ] **Auth:** Login works but no logout endpoint - verify `/auth/logout` clears tokens
- [ ] **Auth:** Register works but no password reset - verify `/auth/forgot-password` exists
- [ ] **Auth:** 401 handling on frontend but no `get_current_user` in backend - verify dependency exists
- [ ] **Products:** Product listing works but no search - verify `/products/search` exists
- [ ] **Products:** Product detail shows images array but backend has no images field - verify schema alignment
- [ ] **Products:** Pagination works but no total count in response - verify API returns metadata
- [ ] **Integration:** Auth works in dev but tokens not validated in prod - verify SECRET_KEY from env

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|---------------|
| SECRET_KEY leaked | HIGH | Force password reset for all users, rotate key, audit logs |
| Hardcoded default in prod | MEDIUM | Add startup validation, force fresh deploy with proper env |
| Missing refresh tokens | MEDIUM | Implement without breaking existing tokens (graceful upgrade) |
| Schema mismatch | LOW | Add missing fields to backend, maintain backward compatibility |
| Missing rate limiting | MEDIUM | Add middleware, no database changes needed |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| No refresh token mechanism | Phase 4 (Auth) | Users stay logged in across sessions |
| Hardcoded SECRET_KEY | Phase 4 (Auth) | App fails to start without valid SECRET_KEY env var |
| No rate limiting on auth | Phase 4 (Auth) | Auth endpoints reject excessive requests |
| Missing current user dependency | Phase 4 (Auth) | Protected routes return 401 without valid token |
| Password reset not implemented | Phase 4 (Auth) | Forgot password flow sends email with reset link |
| Frontend/backend schema mismatch | Phase 5 (Product Catalog) | Products display with all fields including images |
| No product search | Phase 5 (Product Catalog) | Search returns relevant results |
| No SKU/SPU distinction | Phase 5 (Product Catalog) | Product variants show with different stock/prices |
| Missing input validation | Phase 5 (Product Catalog) | Invalid data rejected with clear error messages |
| No image upload mechanism | Phase 5 (Product Catalog) | Product images upload and display correctly |

---

## Sources

- FastAPI Security Best Practices: https://fastapi.tiangolo.com/tutorial/security/
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- E-commerce Platform Common Pitfalls: Industry experience
- JWT Security Best Practices: https://auth0.com/docs/security/store-tokens
- PRD Requirements: `products/ecommerce/PRD-快消品电商用户端功能.md`

---
*Pitfalls research for: FastAPI + React E-commerce Authentication and Product Catalog*
*Researched: 2026-04-16*
