## ADDED Requirements

### Requirement: User list display
The system SHALL display a paginated list of all users with columns: username, phone, email, is_admin, create_at, update_at.

#### Scenario: View user list
- **WHEN** admin navigates to "/admin/users"
- **THEN** system displays a table with all users showing username, phone, email, and admin status

#### Scenario: Pagination works correctly
- **WHEN** admin views user list with more than 10 users
- **THEN** system displays pagination controls and loads 10 users per page

### Requirement: Create user
The system SHALL allow admins to create new users with username, phone, email, and is_admin fields.

#### Scenario: Admin creates new user successfully
- **WHEN** admin fills in username, phone, email, toggles is_admin, and clicks "Create"
- **THEN** system creates the user and displays success message

#### Scenario: Create user with duplicate phone
- **WHEN** admin tries to create a user with a phone number that already exists
- **THEN** system returns error "手机号已被注册"

#### Scenario: Create user with duplicate username
- **WHEN** admin tries to create a user with a username that already exists
- **THEN** system returns error "用户名已被注册"

### Requirement: Edit user
The system SHALL allow admins to edit existing user's username, phone, email, and is_admin fields.

#### Scenario: Admin edits user successfully
- **WHEN** admin clicks edit on a user, modifies fields, and clicks "Save"
- **THEN** system updates the user and displays success message

#### Scenario: Edit user with duplicate phone
- **WHEN** admin tries to change phone to one that belongs to another user
- **THEN** system returns error "手机号已被注册"

### Requirement: Delete user with validation
The system SHALL validate user deletion by checking UserEmployeeMapping before allowing deletion.

#### Scenario: Delete unbinding user
- **WHEN** admin clicks delete on a user that is NOT bound to any employee
- **THEN** system deletes the user and displays success message

#### Scenario: Delete binding user shows error
- **WHEN** admin clicks delete on a user that IS bound to an employee
- **THEN** system returns error "用户已经是「{org_name}」组织的成员，暂时不能删除，如想删除，需要先去组织里解绑用户"

### Requirement: Menu visibility based on admin status
The system SHALL only show "用户管理" menu item to users where is_admin=True.

#### Scenario: Admin sees user management menu
- **WHEN** a user with is_admin=True is logged in
- **THEN** "用户管理" menu appears in the header navigation

#### Scenario: Non-admin does not see user management menu
- **WHEN** a user with is_admin=False is logged in
- **THEN** "用户管理" menu does NOT appear in the header navigation

### Requirement: API permission control
The system SHALL enforce admin permission check on all /api/v1/admin/users endpoints.

#### Scenario: Non-admin cannot access admin user API
- **WHEN** a non-admin user calls any /api/v1/admin/users endpoint
- **THEN** system returns 403 Forbidden

#### Scenario: Admin can access admin user API
- **WHEN** an admin user calls /api/v1/admin/users endpoint
- **THEN** system processes the request normally
