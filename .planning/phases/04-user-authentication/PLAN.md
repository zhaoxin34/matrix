# Phase 4 — User Authentication

**Status:** planning
**Milestone:** v1.1 Feature Implementation
**Created:** 2026-04-16

---

## Executive Summary

Phase 4 implements full JWT-based authentication with phone/password registration and login, SMS verification, token refresh, logout, and password reset. The existing auth.py is a stub — it creates users but has no JWT, no rate limiting, and no password reset. This phase replaces it with production-ready auth.

**Key changes:**
- Backend: Full JWT auth with access + refresh tokens, rate limiting via slowapi, password reset flow
- Frontend: Login/Register/ForgotPassword pages updated to match UI-SPEC, auth store enhanced with refresh logic
- Database: User model extended with phone, password_reset_token, password_history fields

---

## Task Breakdown

### Wave 1: Backend Foundation

1. **Install auth dependencies**
   - `python-jose[cryptography]` for JWT encoding/decoding
   - `passlib[bcrypt]` for password hashing
   - `slowapi` for rate limiting
   - Run: `cd ecommerce/backend && pip install python-jose[cryptography] passlib[bcrypt] slowapi`

2. **Extend User model** (`ecommerce/backend/src/app/models/user.py`)
   - Add `phone: str | None` field with unique index
   - Add `password_reset_token: str | None`
   - Add `password_history: list[str]` (stores last 5 password hashes)
   - Add `failed_login_attempts: int = 0`
   - Add `locked_until: datetime | None`
   - Add `sms_code: str | None` and `sms_code_expires_at: datetime | None`

3. **Create auth schemas** (`ecommerce/backend/src/app/schemas/auth.py`)
   - `UserRegister` — phone, password (min 8, complexity), optional name/email
   - `UserLogin` — phone/email, password
   - `TokenPayload` — sub (user_id), exp, iat, type (access/refresh)
   - `TokenResponse` — access_token, refresh_token, token_type="bearer"
   - `RefreshRequest` — refresh_token
   - `PasswordResetRequest` — phone
   - `PasswordResetConfirm` — phone, code, new_password
   - `SMSCodeRequest` — phone
   - `SMSCodeVerify` — phone, code

4. **Create auth service** (`ecommerce/backend/src/app/services/auth_service.py`)
   - `create_user()` — hash password with bcrypt, create user, return tokens
   - `authenticate()` — verify password, check lockout, track failed attempts, return tokens
   - `refresh_access_token()` — validate refresh token, rotate, return new access
   - `logout()` — invalidate refresh token (add to blacklist or delete)
   - `request_password_reset()` — generate code, store with expiry
   - `reset_password()` — validate code, check history, update password
   - `send_sms_code()` — generate 6-digit code, store with 5-min expiry, rate limit check
   - `verify_sms_code()` — validate code, return success/failure

5. **Add rate limiting** (`ecommerce/backend/src/app/api/v1/auth.py`)
   - Login: 5 attempts per IP per 15 minutes
   - Register: 3 attempts per IP per hour
   - Password reset: 3 attempts per phone per day
   - SMS: 5 requests per phone per hour
   - Use slowapi Limiter decorator

6. **Add get_current_user dependency** (`ecommerce/backend/src/app/dependencies.py`)
   - Extract Bearer token from Authorization header
   - Decode and validate JWT
   - Return user from database
   - Raise 401 for invalid/expired tokens

7. **Add SECRET_KEY validation** (`ecommerce/backend/src/app/config.py`)
   - Load SECRET_KEY from env
   - Fail fast on startup if not set or is default
   - Add `SECRET_KEY=generate` option for dev key generation

### Wave 2: Backend Endpoints

8. **Replace auth endpoints** (`ecommerce/backend/src/app/api/v1/auth.py`)
   - `POST /auth/register` — phone + password, return tokens
   - `POST /auth/login` — phone/password, track attempts, return tokens
   - `POST /auth/refresh` — exchange refresh for new access
   - `POST /auth/logout` — invalidate refresh token
   - `POST /auth/password-reset/request` — send SMS code
   - `POST /auth/password-reset/confirm` — verify code + reset password
   - `POST /auth/sms/send` — send verification code
   - `POST /auth/sms/verify` — verify code
   - `GET /auth/me` — protected, return current user

### Wave 3: Frontend

9. **Update auth store** (`ecommerce/frontend/src/stores/authStore.ts`)
   - Add `accessToken`, `refreshToken`, `user` state
   - Add `login(phone, password)` — call API, store tokens
   - Add `register(data)` — call API, store tokens
   - Add `refreshAccessToken()` — use refresh token to get new access
   - Add `logout()` — clear tokens, redirect to login
   - Add `fetchCurrentUser()` — call /auth/me with access token
   - Add token to Axios interceptor

10. **Update Login page** (`ecommerce/frontend/src/pages/Login.tsx`)
    - Change from email to phone/email input
    - Add lockout error display with countdown
    - Add "Forgot password?" link

11. **Update Register page** (`ecommerce/frontend/src/pages/Register.tsx`)
    - Phone + password + name fields
    - SMS code verification step
    - Terms checkbox
    - Password complexity indicator

12. **Create ForgotPassword page** (`ecommerce/frontend/src/pages/ForgotPassword.tsx`)
    - Phone input + SMS code + new password + confirm
    - Countdown timer for resend

13. **Create ResetSuccess page** (`ecommerce/frontend/src/pages/ResetSuccess.tsx`)
    - Success message + "返回登录" button

14. **Update Header** (`ecommerce/frontend/src/components/layout/Header.tsx`)
    - Show user dropdown when authenticated
    - Dropdown: 我的账户, 我的订单, divider, 退出登录

15. **Add routes** (`ecommerce/frontend/src/App.tsx`)
    - `/login` → Login
    - `/register` → Register
    - `/forgot-password` → ForgotPassword
    - `/reset-success` → ResetSuccess
    - Protected routes wrapped in auth guard

---

## Verification Checklist

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | User can register with phone + password, receive JWT tokens | POST /auth/register with phone+password → returns access_token + refresh_token |
| 2 | User can login with phone/password, access protected endpoints | POST /auth/login → use access_token in Authorization: Bearer header to call GET /auth/me |
| 3 | User can refresh expired access token | Wait for access_token expiry or use /auth/refresh with refresh_token |
| 4 | User can logout and tokens are invalidated | POST /auth/logout, then try using refresh_token → should fail |
| 5 | User can request password reset via SMS, reset password | POST /auth/password-reset/request, then POST /auth/password-reset/confirm with code |
| 6 | Rate limits enforced | Hit login 6 times rapidly → 6th request returns 429 |
| 7 | Protected endpoints identify user from JWT | Call /auth/me with valid token → returns user object; with invalid token → returns 401 |

---

## Dependencies

- Phase 3 (Integration & DevOps) — MySQL database, Alembic migrations
- ecommerce/backend/src/app/models/user.py — User model base
- ecommerce/backend/src/app/config.py — Settings
- ecommerce/frontend/src/hooks/useAuth.ts — existing hook
- ecommerce/frontend/src/stores/authStore.ts — existing store
- ecommerce/frontend/src/api/axios.ts — existing Axios instance

---

## File Structure

```
ecommerce/backend/src/app/
├── api/v1/
│   └── auth.py          # MODIFY — replace with full auth endpoints + rate limiting
├── core/
│   └── security.py      # CREATE — JWT encode/decode, password hashing, token generation
├── schemas/
│   └── auth.py          # CREATE — Pydantic schemas for auth requests/responses
├── services/
│   └── auth_service.py  # CREATE — auth business logic, token management
├── repositories/
│   └── user_repo.py     # MODIFY — add get_by_phone, update_password, etc.
├── dependencies.py      # MODIFY — add get_current_user dependency
├── config.py            # MODIFY — add SECRET_KEY validation

ecommerce/frontend/src/
├── pages/
│   ├── Login.tsx        # MODIFY — update to phone + lockout display
│   ├── Register.tsx      # MODIFY — add SMS verification
│   ├── ForgotPassword.tsx   # CREATE
│   └── ResetSuccess.tsx     # CREATE
├── stores/
│   └── authStore.ts     # MODIFY — add token storage, refresh logic
├── components/layout/
│   └── Header.tsx       # MODIFY — add user dropdown
├── api/
│   └── modules/user.ts  # MODIFY — add /auth/me, /auth/refresh calls
└── App.tsx              # MODIFY — add auth routes, protected route wrapper

ecommerce/backend/alembic/versions/
└── 002_add_auth_fields.py  # CREATE — migration for new User fields
```
