# Status API Specification

## ADDED Requirements

### Requirement: Status List API

The API SHALL provide a list endpoint for retrieving status records with filtering and pagination support.

#### Scenario: Get status list with default pagination

- **WHEN** client sends `GET /api/v1/workspaces/{workspace_code}/status`
- **THEN** system returns 200 OK with paginated status list (page=1, page_size=20), sorted by captured_at descending

#### Scenario: Get status list with custom pagination

- **WHEN** client sends `GET /api/v1/workspaces/{workspace_code}/status?page=2&page_size=50`
- **THEN** system returns 200 OK with page 2 containing up to 50 status records

#### Scenario: Filter status by entity_name

- **WHEN** client sends `GET /api/v1/workspaces/{workspace_code}/status?entity_name=lead_123`
- **THEN** system returns 200 OK with only status records with exact entity_name match

#### Scenario: Filter status by captured_at range

- **WHEN** client sends `GET /api/v1/workspaces/{workspace_code}/status?captured_start=2026-06-01T00:00:00Z&captured_end=2026-06-30T23:59:59Z`
- **THEN** system returns 200 OK with only status records within the captured_at range

#### Scenario: Filter status by source

- **WHEN** client sends `GET /api/v1/workspaces/{workspace_code}/status?source=crm_page_view`
- **THEN** system returns 200 OK with only status records with exact source match

#### Scenario: Unauthorized workspace access

- **WHEN** client sends request to a workspace they don't have access to
- **THEN** system returns 403 Forbidden with code 3002

### Requirement: Status Detail API

The API SHALL provide a detail endpoint for retrieving a single status record by ID.

#### Scenario: Get status by ID

- **WHEN** client sends `GET /api/v1/workspaces/{workspace_code}/status/{id}`
- **THEN** system returns 200 OK with complete status data including formatted attributes JSON

#### Scenario: Status not found

- **WHEN** client sends request for non-existent status ID
- **THEN** system returns 404 Not Found with code 2001

### Requirement: Create Status API

The API SHALL provide an endpoint for creating new status records.

#### Scenario: Create status successfully

- **WHEN** client sends `POST /api/v1/workspaces/{workspace_code}/status` with valid status data
- **THEN** system returns 201 Created with the created status data including system-generated id and timestamps

#### Scenario: Create status with validation error

- **WHEN** client sends `POST /api/v1/workspaces/{workspace_code}/status` with missing required field
- **THEN** system returns 400 Bad Request with code 1001 and error message

#### Scenario: Create status with duplicate entity and timestamp

- **WHEN** client sends `POST /api/v1/workspaces/{workspace_code}/status` with same entity_name and captured_at as existing record
- **THEN** system returns 409 Conflict with code 2002

### Requirement: Update Status API

The API SHALL provide an endpoint for updating existing status records.

#### Scenario: Update status successfully

- **WHEN** client sends `PUT /api/v1/workspaces/{workspace_code}/status/{id}` with valid status data
- **THEN** system returns 200 OK with the updated status data

#### Scenario: Update non-existent status

- **WHEN** client sends `PUT /api/v1/workspaces/{workspace_code}/status/{id}` with non-existent ID
- **THEN** system returns 404 Not Found with code 2001

### Requirement: Delete Status API

The API SHALL provide an endpoint for hard-deleting status records.

#### Scenario: Delete status successfully

- **WHEN** client sends `DELETE /api/v1/workspaces/{workspace_code}/status/{id}`
- **THEN** system returns 200 OK and the status record is permanently removed from database

#### Scenario: Delete non-existent status

- **WHEN** client sends `DELETE /api/v1/workspaces/{workspace_code}/status/{id}` with non-existent ID
- **THEN** system returns 404 Not Found with code 2001

### Requirement: API Response Format

All API responses SHALL follow a standardized response format with code, message, data, traceId, and timestamp.

#### Scenario: Successful response format

- **WHEN** any API request succeeds
- **THEN** response body contains `{code: 0, message: "ok", data: {...}, traceId: "xxx", timestamp: 1234567890}`

#### Scenario: Error response format

- **WHEN** any API request fails
- **THEN** response body contains `{code: <error_code>, message: "<error_message>", data: null, traceId: "xxx", timestamp: 1234567890}`

### Requirement: Attributes JSON Validation

The API SHALL validate that attributes field contains valid JSON object.

#### Scenario: Create status with valid attributes JSON

- **WHEN** client sends `POST /api/v1/workspaces/{workspace_code}/status` with valid JSON attributes `{"name": "test"}`
- **THEN** system returns 201 Created

#### Scenario: Create status with invalid attributes JSON

- **WHEN** client sends `POST /api/v1/workspaces/{workspace_code}/status` with invalid attributes JSON
- **THEN** system returns 400 Bad Request with code 1001
