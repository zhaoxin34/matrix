# Event API Specification

## ADDED Requirements

### Requirement: Event List API

The API SHALL provide a list endpoint for retrieving events with filtering and pagination support.

#### Scenario: Get event list with default pagination

- **WHEN** client sends `GET /api/v1/workspaces/{workspace_code}/events`
- **THEN** system returns 200 OK with paginated event list (page=1, page_size=20), sorted by timestamp descending

#### Scenario: Get event list with custom pagination

- **WHEN** client sends `GET /api/v1/workspaces/{workspace_code}/events?page=2&page_size=50`
- **THEN** system returns 200 OK with page 2 containing up to 50 events

#### Scenario: Filter events by name

- **WHEN** client sends `GET /api/v1/workspaces/{workspace_code}/events?name=lead.assigned`
- **THEN** system returns 200 OK with only events whose name contains "lead.assigned" (case-insensitive)

#### Scenario: Filter events by entity_name

- **WHEN** client sends `GET /api/v1/workspaces/{workspace_code}/events?entity_name=lead_123`
- **THEN** system returns 200 OK with only events with exact entity_name match

#### Scenario: Filter events by actor

- **WHEN** client sends `GET /api/v1/workspaces/{workspace_code}/events?actor=john`
- **THEN** system returns 200 OK with only events whose actor contains "john"

#### Scenario: Filter events by timestamp range

- **WHEN** client sends `GET /api/v1/workspaces/{workspace_code}/events?timestamp_start=2026-06-01T00:00:00Z&timestamp_end=2026-06-30T23:59:59Z`
- **THEN** system returns 200 OK with only events within the timestamp range

#### Scenario: Unauthorized workspace access

- **WHEN** client sends request to a workspace they don't have access to
- **THEN** system returns 403 Forbidden with code 3002

### Requirement: Event Detail API

The API SHALL provide a detail endpoint for retrieving a single event by ID.

#### Scenario: Get event by ID

- **WHEN** client sends `GET /api/v1/workspaces/{workspace_code}/events/{id}`
- **THEN** system returns 200 OK with complete event data

#### Scenario: Event not found

- **WHEN** client sends request for non-existent event ID
- **THEN** system returns 404 Not Found with code 2001

### Requirement: Create Event API

The API SHALL provide an endpoint for creating new events.

#### Scenario: Create event successfully

- **WHEN** client sends `POST /api/v1/workspaces/{workspace_code}/events` with valid event data
- **THEN** system returns 201 Created with the created event data including system-generated id and timestamps

#### Scenario: Create event with validation error

- **WHEN** client sends `POST /api/v1/workspaces/{workspace_code}/events` with missing required field
- **THEN** system returns 400 Bad Request with code 1001 and error message

#### Scenario: Create event with invalid entity_name format

- **WHEN** client sends `POST /api/v1/workspaces/{workspace_code}/events` with entity_name not matching `{type}_{id}` format
- **THEN** system returns 400 Bad Request with error "实体名称格式不正确"

### Requirement: Update Event API

The API SHALL provide an endpoint for updating existing events.

#### Scenario: Update event successfully

- **WHEN** client sends `PUT /api/v1/workspaces/{workspace_code}/events/{id}` with valid event data
- **THEN** system returns 200 OK with the updated event data

#### Scenario: Update non-existent event

- **WHEN** client sends `PUT /api/v1/workspaces/{workspace_code}/events/{id}` with non-existent ID
- **THEN** system returns 404 Not Found with code 2001

### Requirement: Delete Event API

The API SHALL provide an endpoint for hard-deleting events.

#### Scenario: Delete event successfully

- **WHEN** client sends `DELETE /api/v1/workspaces/{workspace_code}/events/{id}`
- **THEN** system returns 200 OK and the event is permanently removed from database

#### Scenario: Delete non-existent event

- **WHEN** client sends `DELETE /api/v1/workspaces/{workspace_code}/events/{id}` with non-existent ID
- **THEN** system returns 404 Not Found with code 2001

### Requirement: API Response Format

All API responses SHALL follow a standardized response format with code, message, data, traceId, and timestamp.

#### Scenario: Successful response format

- **WHEN** any API request succeeds
- **THEN** response body contains `{code: 0, message: "ok", data: {...}, traceId: "xxx", timestamp: 1234567890}`

#### Scenario: Error response format

- **WHEN** any API request fails
- **THEN** response body contains `{code: <error_code>, message: "<error_message>", data: null, traceId: "xxx", timestamp: 1234567890}`
