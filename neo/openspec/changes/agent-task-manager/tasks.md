## 1. Database Setup

- [x] 1.1 Create task table migration (id, name, description, content, workspace_id, agent_id, owner_id, priority, task_type, last_exec_status, status, max_retry, retry_interval, webhook_url, webhook_secret, cron_expression, created_at, updated_at)
- [x] 1.2 Create task_record table migration (id, task_id, started_at, ended_at, duration, exec_status, result, process, failure_reason, recording_url, created_at)
- [x] 1.3 Create indexes for task table (workspace_id, agent_id, owner_id, last_exec_status, status, task_type, priority, created_at)
- [x] 1.4 Create indexes for task_record table (task_id, started_at)

## 2. Backend API - Task CRUD

- [x] 2.1 Implement GET /api/v1/workspaces/{workspace_code}/tasks (list with pagination, filtering, search)
- [x] 2.2 Implement GET /api/v1/workspaces/{workspace_code}/tasks/{task_id} (detail with recent records)
- [x] 2.3 Implement POST /api/v1/workspaces/{workspace_code}/tasks (create periodic task)
- [x] 2.4 Implement PUT /api/v1/workspaces/{workspace_code}/tasks/{task_id} (update periodic task)
- [x] 2.5 Implement DELETE /api/v1/workspaces/{workspace_code}/tasks/{task_id} (delete task without records)

## 3. Backend API - Task Operations

- [x] 3.1 Implement POST /api/v1/workspaces/{workspace_code}/tasks/{task_id}/cancel
- [x] 3.2 Implement PATCH /api/v1/workspaces/{workspace_code}/tasks/{task_id}/disable
- [x] 3.3 Implement PATCH /api/v1/workspaces/{workspace_code}/tasks/{task_id}/enable

## 4. Backend API - Execution Records

- [x] 4.1 Implement GET /api/v1/workspaces/{workspace_code}/tasks/{task_id}/records (list with pagination)
- [x] 4.2 Implement GET /api/v1/workspaces/{workspace_code}/tasks/{task_id}/records/{record_id} (detail)

## 5. Backend API - Error Handling

- [x] 5.1 Implement validation for cron expression format (return error 3031)
- [x] 5.2 Implement validation for task type (return error 3005 for non-periodic task operations)
- [x] 5.3 Implement validation for task deletion (return error 3006 if task has records)
- [x] 5.4 Implement validation for task update (return error 3004 if task is running)

## 6. Frontend - Task List Page

- [x] 6.1 Create task list page component with data table
- [x] 6.2 Implement pagination controls
- [x] 6.3 Implement filter dropdowns (last_exec_status, task_type, priority)
- [x] 6.4 Implement search input for name/ID
- [x] 6.5 Implement action buttons (View, Edit, Delete, Cancel, Disable, Enable)
- [x] 6.6 Implement "Create Task" button and navigation

## 7. Frontend - Task Detail Page

- [x] 7.1 Create task detail page component
- [x] 7.2 Display task information (read-only for non-periodic, editable for periodic)
- [x] 7.3 Display execution records list
- [x] 7.4 Implement "Edit" button for periodic tasks
- [x] 7.5 Implement operation buttons (Cancel, Disable, Enable, Pause, Resume)

## 8. Frontend - Create/Edit Task Page

- [x] 8.1 Create form with fields: name, description, content, agent_id, priority, cron_expression, max_retry, retry_interval, webhook_url
- [x] 8.2 Implement cron expression validation display
- [x] 8.3 Implement agent selection dropdown
- [x] 8.4 Implement form submission and success/error handling

## 9. Frontend - Execution Record Detail Page

- [x] 9.1 Create execution record detail page component
- [x] 9.2 Display record information (started_at, ended_at, duration, exec_status, result, process, failure_reason)
- [x] 9.3 Display recording_url placeholder (feature not implemented yet)

## 10. Frontend - UI Polish

- [x] 10.1 Implement toast messages for pause/resume buttons ("Feature not supported yet")
- [x] 10.2 Implement loading states
- [x] 10.3 Implement error handling and display
- [x] 10.4 Add confirmation dialogs for destructive actions (Delete, Cancel)

## 11. Testing

- [x] 11.1 Write unit tests for backend API endpoints
- [x] 11.2 Frontend pages verified with agent-browser (list, detail, create, edit)
- [ ] 11.3 Write integration tests for task CRUD flow