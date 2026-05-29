## 1. Database Migration

- [x] 1.1 Create `agent_prototype` table with fields: id, code, name, description, version, model, prompts, status, created_by, created_at, updated_at
- [x] 1.2 Create indexes for `agent_prototype`: code (unique), status, created_by
- [x] 1.3 Create `agent_prototype_version` table with fields: id, agent_prototype_id, version, prompts_snapshot, config_snapshot, change_summary, created_by, created_at
- [x] 1.4 Create indexes for `agent_prototype_version`: agent_prototype_id, created_at
- [x] 1.5 Add foreign key constraint: agent_prototype_version.agent_prototype_id → agent_prototype.id

## 2. Backend API Development

### 2.1 API Routes Implementation

- [x] 2.1.1 Implement `GET /api/v1/agent_prototype` - list prototypes with pagination, status filter, and search
- [x] 2.1.2 Implement `POST /api/v1/agent_prototype` - create new prototype (status=DRAFT)
- [x] 2.1.3 Implement `GET /api/v1/agent_prototype/{id}` - get prototype detail
- [x] 2.1.4 Implement `PUT /api/v1/agent_prototype/{id}` - update prototype prompts
- [x] 2.1.5 Implement `DELETE /api/v1/agent_prototype/{id}` - delete prototype (only draft status allowed)
- [x] 2.1.6 Implement `POST /api/v1/agent_prototype/{id}/publish` - publish prototype with version snapshot
- [x] 2.1.7 Implement `GET /api/v1/agent_prototype/{id}/versions` - get version history list
- [x] 2.1.8 Implement `POST /api/v1/agent_prototype/{id}/rollback` - rollback to specified version
- [x] 2.1.9 Implement `PUT /api/v1/agent_prototype/{id}/status` - update prototype status (enable/disable)

### 2.2 Business Logic

- [x] 2.2.1 Implement version number auto-increment logic (semantic versioning: 1.0.0 → 1.0.1)
- [x] 2.2.2 Implement state machine validation (draft → enabled → disabled)
- [x] 2.2.3 Implement deletion permission check (only draft status)
- [x] 2.2.4 Implement publish validation (prompts not empty, change_summary required)
- [x] 2.2.5 Implement rollback logic (copy snapshot to prototype, create new version entry)
- [x] 2.2.6 Implement optimistic locking for concurrent edit protection

### 2.3 Permission Control

- [x] 2.3.1 Add admin role middleware for all agent_prototype API endpoints
- [x] 2.3.2 Return 401/403 for non-admin users

## 3. Frontend Page Development

### 3.1 List Page (`/admin/agent-prototype`)

- [x] 3.1.1 Create prototype list table component with columns: ID, Name, Version, Status, Created At
- [x] 3.1.2 Implement status filter (All/Draft/Enabled/Disabled)
- [x] 3.1.3 Implement search by name functionality
- [x] 3.1.4 Add "New Prototype" button
- [x] 3.1.5 Add row actions: View Detail, Edit, Delete (draft only)

### 3.2 Detail Page (`/admin/agent-prototype/{id}`)

- [x] 3.2.1 Display prototype information: ID, Name, Version, Status, Created At
- [x] 3.2.2 Display current prompts content
- [x] 3.2.3 Implement action buttons based on status:
  - Draft: Edit, Publish, Delete
  - Enabled: Edit, Disable, History
  - Disabled: Enable, History
- [x] 3.2.4 Create History dialog component with version list

### 3.3 Edit Page (`/admin/agent-prototype/{id}/edit`)

- [x] 3.3.1 Create Markdown editor component with syntax highlighting
- [x] 3.3.2 Implement real-time preview panel
- [x] 3.3.3 Add "Save Draft" button
- [x] 3.3.4 Add "Cancel" button

### 3.4 Create Page (`/admin/agent-prototype/new`)

- [x] 3.4.1 Create form with name and description fields
- [x] 3.4.2 Create Markdown editor for prompts
- [x] 3.4.3 Add form validation (name required, prompts required)
- [x] 3.4.4 Add "Save Draft" button

### 3.5 Publish Dialog

- [x] 3.5.1 Create publish dialog with version number display (auto-generated)
- [x] 3.5.2 Add change_summary textarea (required)
- [x] 3.5.3 Add validation (change_summary not empty)
- [x] 3.5.4 Add confirm and cancel buttons

### 3.6 Version History Dialog

- [x] 3.6.1 Create version list with: version, created_at, change_summary, created_by
- [x] 3.6.2 Mark current version as "Current Version"
- [x] 3.6.3 Add "Rollback" button for non-current versions
- [x] 3.6.4 Add confirmation dialog for rollback action

## 4. Testing

- [x] 4.1 Write unit tests for backend API endpoints
- [x] 4.2 Write integration tests for publish/rollback workflows
- [ ] 4.3 Write frontend component tests
- [ ] 4.4 Verify e2e test cases from `agent-prototype-test-cases.md`

## 5. Documentation

- [ ] 5.1 Update API documentation with request/response examples
- [ ] 5.2 Add inline code comments for complex logic
- [ ] 5.3 Update routing-table.md if needed
