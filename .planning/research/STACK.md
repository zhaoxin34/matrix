# Stack Research: User Authentication and Product Catalog

**Domain:** E-commerce Platform - Auth & Catalog Features
**Researched:** 2026-04-16
**Confidence:** HIGH

## Executive Summary

The existing stack already contains the essential building blocks for both features. User authentication requires no new backend libraries (python-jose, passlib, bcrypt already present) and minimal frontend additions (auth store pattern with Zustand). Product catalog requires only SQLAlchemy filtering/pagination (already available) and frontend pagination components (Ant Design Table already present).

**Key insight:** Build custom JWT auth using existing libraries rather than fastapi-users for maximum control over the auth flow (important for future AI agent integration).

---

## Recommended Stack

### Backend - No New Core Dependencies Required

| Technology | Current Version | Status | Notes |
|------------|-----------------|--------|-------|
| FastAPI | >=0.109.0 | Already installed | Web framework |
| python-jose[cryptography] | >=3.3.0 | Already installed | JWT token creation/validation |
| passlib[bcrypt] | >=1.7.4 | Already installed | Password hashing |
| bcrypt | >=4.1.0 | Already installed | Bcrypt algorithm |
| SQLAlchemy | >=2.0.0 | Already installed | ORM with filtering/pagination |
| python-multipart | >=0.0.6 | Already installed | Form data handling |

**Backend Analysis:**
- All JWT authentication libraries are already in requirements.txt
- SQLAlchemy 2.0 provides robust filtering (`.filter()`) and pagination (`.limit()`, `.offset()`) natively
- No additional auth libraries needed - build custom auth dependency using existing JWT libs

### Backend - Recommended Additions

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| PyJWT | >=2.8.0 | JWT encoding/decoding | More actively maintained than python-jose's jwt module alone |

### Frontend - No New Core Dependencies Required

| Technology | Current Version | Status | Notes |
|------------|-----------------|--------|-------|
| React | ^18.2.0 | Already installed | UI framework |
| axios | ^1.6.8 | Already installed | HTTP client with interceptors |
| zustand | ^4.5.2 | Already installed | State management (use for auth store) |
| antd | ^5.15.0 | Already installed | Table, Card, Pagination components |
| react-router-dom | ^6.22.3 | Already installed | Routing |
| zod | ^3.22.4 | Already installed | Schema validation |

**Frontend Analysis:**
- Ant Design Table provides built-in pagination and sorting
- Zustand auth store pattern handles client-side auth state
- Existing axios interceptor handles JWT token injection

### Frontend - Optional Addition

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | ^5.60.0 | Server state management | If product catalog data fetching becomes complex (multiple filters, real-time updates) |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| fastapi-users | Adds abstraction layer that obscures auth flow; less control for AI agent integration | Custom auth with python-jose + passlib |
| SQLAlchemy-Filters | Unnecessary; SQLAlchemy 2.0 `.filter()` is sufficient | Native SQLAlchemy `.filter()` |
| Express-session / cookie-based auth | Not suitable for SPA + API architecture; JWT is standard | JWT Bearer tokens (already configured) |
| Redux | Overkill; Zustand is lighter and sufficient | Zustand (already installed) |
| Apollo Client | Overkill for simple catalog; adds GraphQL complexity | axios + React Query if needed |

---

## Authentication Architecture

### Backend Auth Flow

```
POST /auth/register → Create user (hash password with passlib)
POST /auth/login → Validate credentials, return JWT (access + refresh tokens)
POST /auth/refresh → Refresh access token
POST /auth/logout → Invalidate token (if using Redis blacklist)
GET /auth/me → Get current user (protected endpoint)
```

### Auth Dependencies Already in Stack

```python
# requirements.txt already has:
python-jose[cryptography]>=3.3.0  # JWT handling
passlib[bcrypt]>=1.7.4            # Password hashing
bcrypt>=4.1.0                      # Bcrypt algorithm
```

### Recommended Backend Additions

```bash
# No new packages required - existing libraries sufficient
# Optional: explicit PyJWT for cleaner JWT API
pip install PyJWT>=2.8.0
```

### Frontend Auth Pattern

```typescript
// Zustand auth store (no new libraries)
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
}
```

---

## Product Catalog Architecture

### Backend

| Capability | Implementation | Library |
|------------|----------------|---------|
| List products | SQLAlchemy `select()` with `.offset()` and `.limit()` | SQLAlchemy >=2.0.0 |
| Filter by category/price | SQLAlchemy `.filter()` with multiple conditions | SQLAlchemy >=2.0.0 |
| Search by name | SQLAlchemy `.filter(Model.name.ilike(f"%{search}%"))` | SQLAlchemy >=2.0.0 |
| Sort products | SQLAlchemy `.order_by()` | SQLAlchemy >=2.0.0 |
| Count total | SQLAlchemy `func.count()` | SQLAlchemy >=2.0.0 |

### Frontend

| Capability | Implementation | Library |
|-----------|----------------|---------|
| Product grid | Ant Design Card components | antd ^5.15.0 |
| Product table with pagination | Ant Design Table with pagination | antd ^5.15.0 |
| Search bar | Ant Design Input.Search | antd ^5.15.0 |
| Category filter | Ant Design Select | antd ^5.15.0 |
| Price range | Ant Design Slider | antd ^5.15.0 |

---

## Installation

### Backend

```bash
# No new dependencies required
# Existing requirements.txt has all necessary packages
pip install -r requirements.txt

# Optional: explicit PyJWT for cleaner API
pip install PyJWT>=2.8.0
```

### Frontend

```bash
# No new dependencies required
# Existing package.json has all necessary packages
npm install

# Optional: for complex data fetching scenarios
npm install @tanstack/react-query@^5.60.0
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|------------------------|
| Custom JWT auth | fastapi-users | If rapid prototyping without caring about auth internals |
| Native SQLAlchemy filtering | elasticsearch-dsl | If product catalog scales to millions of items with complex search |
| axios (existing) | @tanstack/react-query | If complex caching/invalidation needs arise |
| Ant Design (existing) | MUI / Chakra UI | If design requirements change significantly |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| PyJWT>=2.8.0 | python-jose>=3.3.0 | Both use same JWT standard; compatible |
| @tanstack/react-query@^5.60.0 | react@^18.2.0 | v5 requires React 18.2+ |
| @tanstack/react-query@^5.60.0 | zustand@^4.5.2 | Compatible; different state domains |

---

## Integration Points

### Backend Auth Integration

1. **JWT Dependency** - Create `get_current_user` dependency using python-jose
2. **Password Hashing** - Use passlib with bcrypt context
3. **Token Storage** - Redis already available for refresh token blacklist

### Frontend Auth Integration

1. **Axios Interceptor** - Already configured for JWT injection
2. **Zustand Store** - Create auth store following existing patterns
3. **React Router** - Protected route wrapper using auth state

### Product Catalog Integration

1. **API Pagination** - Backend returns `total`, `page`, `page_size`, `items`
2. **Ant Design Table** - Built-in pagination config matches API response
3. **Filter State** - URL query params for shareable filter states

---

## Sources

- Context7 `/fastapi/fastapi` — OAuth2 JWT authentication patterns
- Context7 `/fastapi-users/fastapi-users` — FastAPI Users library (reviewed but not recommended)
- Context7 `/websites/sqlalchemy_en_20` — SQLAlchemy 2.0 filtering and pagination
- Context7 `/pmndrs/zustand` — Zustand state management
- Context7 `/tanstack/query` — TanStack Query (optional addition)
- Project requirements.txt — Current backend dependencies
- Project package.json — Current frontend dependencies

---

*Stack research for: User Authentication and Product Catalog features*
*Researched: 2026-04-16*
