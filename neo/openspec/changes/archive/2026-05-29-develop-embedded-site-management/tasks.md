## 1. Database Setup

- [x] 1.1 Create `embedded_sites` table with columns: id, site_name, site_url, description, workspace_id, status, created_by, created_at, updated_at, deleted_at
- [x] 1.2 Add indexes: idx_es_workspace, idx_es_site_name, idx_es_status, idx_es_created_by
- [x] 1.3 Add unique constraint: uk_es_workspace_name (workspace_id, site_name)
- [x] 1.4 Create database migration file

## 2. Backend API Implementation

### 2.1 Schema and Models

- [x] 2.1.1 Create Pydantic schemas for EmbeddedSite (EmbeddedSiteCreate, EmbeddedSiteUpdate, EmbeddedSiteResponse)
- [x] 2.1.2 Create database model for EmbeddedSite table
- [x] 2.1.3 Add repository layer for CRUD operations

### 2.2 API Endpoints

- [x] 2.2.1 Implement GET `/api/v1/workspaces/{workspace_code}/embedded-sites` (list with pagination, search, status filter)
- [x] 2.2.2 Implement GET `/api/v1/workspaces/{workspace_code}/embedded-sites/{id}` (get single)
- [x] 2.2.3 Implement POST `/api/v1/workspaces/{workspace_code}/embedded-sites` (create)
- [x] 2.2.4 Implement PUT `/api/v1/workspaces/{workspace_code}/embedded-sites/{id}` (update)
- [x] 2.2.5 Implement DELETE `/api/v1/workspaces/{workspace_code}/embedded-sites/{id}` (delete)
- [x] 2.2.6 Implement PATCH `/api/v1/workspaces/{workspace_code}/embedded-sites/{id}/enable` (enable)
- [x] 2.2.7 Implement PATCH `/api/v1/workspaces/{workspace_code}/embedded-sites/{id}/disable` (disable)

### 2.3 Business Logic

- [x] 2.3.1 Add validation for site_url format
- [x] 2.3.2 Add duplicate name check within workspace
- [ ] 2.3.3 Add agent association check before delete
- [x] 2.3.4 Implement idempotent enable/disable operations

## 3. Frontend Implementation (frontend project)

### 3.1 Components

- [x] 3.1.1 Implement EmbeddedSiteList with pagination, search, and status filter
- [x] 3.1.2 Implement EmbeddedSiteForm for create/edit
- [x] 3.1.3 Add enable/disable toggle functionality
- [x] 3.1.4 Update sidebar-content.tsx link to `/workspace/{code}/embedded-sites`

### 3.2 API Integration

- [x] 3.2.1 Create API client functions for embedded-sites endpoints
- [x] 3.2.2 Add error handling and loading states
- [x] 3.2.3 Integrate with workspace API to get workspace_id from code

### 3.3 Pages

- [x] 3.3.1 Create embedded-sites list page at `/app/(main)/workspace/[workspace_code]/embedded-sites/page.tsx`
- [x] 3.3.2 Create create page at `/app/(main)/workspace/[workspace_code]/embedded-sites/new/page.tsx`
- [x] 3.3.3 Create edit page at `/app/(main)/workspace/[workspace_code]/embedded-sites/[id]/edit/page.tsx`
- [x] 3.3.4 Update login/register success redirects to `/workspace/embedded-sites`

## 4. Testing

- [x] 4.1 Write backend unit tests for CRUD operations
- [x] 4.2 Write backend unit tests for status toggle
- [ ] 4.3 Write e2e test cases for embedded site management (see e2e-test-case)
- [ ] 4.4 Test frontend components with Storybook or unit tests

## 5. Code Review

### 5.1 Backend Code Quality (backend/)

- [x] 5.1.1 Run `make lint` to check code style
- [x] 5.1.2 Run `make format` to format code
- [x] 5.1.3 Run `make typecheck` to verify type correctness
- [x] 5.1.4 Run `/simplify` to optimize and simplify code

### 5.2 Frontend Code Quality (frontend/)

- [x] 5.2.1 Run `make lint` to check code style
- [x] 5.2.2 Run `make format` to format code
- [x] 5.2.3 Run `make typecheck` to verify type correctness
- [x] 5.2.4 Run `pnpm lint` to check ESLint rules
- [x] 5.2.5 Run `pnpm type-check` for TypeScript validation