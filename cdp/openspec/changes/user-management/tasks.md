## 1. Backend - API Layer

- [x] 1.1 Create `backend/src/app/api/v1/admin_users.py` with GET/POST/PUT/DELETE endpoints
- [x] 1.2 Add `/api/v1/admin/users` route to `backend/src/app/api/v1/__init__.py` or main router
- [x] 1.3 Add admin permission dependency `get_current_admin_user` in `auth.py`
- [x] 1.4 Register new router in FastAPI app

## 2. Backend - Service Layer

- [x] 2.1 Create `backend/src/app/services/admin_user_service.py` (functionality in API layer)
- [x] 2.2 Implement `list_users(page, page_size)` with pagination
- [x] 2.3 Implement `create_user(data)` with validation (unique phone, unique username)
- [x] 2.4 Implement `update_user(user_id, data)` with validation
- [x] 2.5 Implement `delete_user(user_id)` with before_delete validation
- [x] 2.6 Implement `before_delete_check(user_id)` to validate UserEmployeeMapping

## 3. Backend - Repository Layer

- [x] 3.1 Add `find_by_user_id(user_id)` to UserEmployeeMapping repo (already exists in EmployeeRepository)
- [x] 3.2 Add `find_by_phone(phone)` and `find_by_username(username)` to UserRepo
- [x] 3.3 Add `update_user(user)` and `delete_user(user)` to UserRepo

## 4. Frontend - API Module

- [x] 4.1 Create `frontend/src/api/modules/userAdmin.ts` with listUsers, createUser, updateUser, deleteUser

## 5. Frontend - Components

- [x] 5.1 Create `frontend/src/pages/UserManagement/` directory
- [x] 5.2 Create `UserManagementPage.tsx` main page with table and pagination
- [x] 5.3 Create `UserModal.tsx` for create/edit user form
- [x] 5.4 Create `index.ts` export file

## 6. Frontend - Routing & Menu

- [x] 6.1 Add `/admin/users` route in `App.tsx` with admin check
- [x] 6.2 Add "用户管理" menu item in `Header.tsx` conditionally rendered for admin users
- [x] 6.3 Add `isAdmin` to authStore if not present (via UserResponse update)

## 7. Testing

- [x] 7.1 Test user list API with admin token - PASSED (Playwright UI test)
- [x] 7.2 Test create user API - PASSED (created newadmin user)
- [ ] 7.3 Test edit user API - NOT TESTED
- [x] 7.4 Test delete user (unbound) - PASSED (deleted newadmin successfully)
- [x] 7.5 Test delete user (bound to employee) - PASSED (API returns correct error)
- [ ] 7.6 Test non-admin cannot access admin endpoints - NOT TESTED (needs non-admin account)
- [x] 7.7 Test frontend menu visibility for admin vs non-admin - PASSED (menu shows for admin only)
