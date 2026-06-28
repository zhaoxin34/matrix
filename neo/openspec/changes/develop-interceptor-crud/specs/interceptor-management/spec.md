# Interceptor Management

## ADDED Requirements

### Requirement: Create Interceptor

The system SHALL allow administrators to create a new interceptor with required fields.

#### Scenario: Create interceptor with all fields

- **WHEN** admin submits POST /api/v1/workspaces/{workspace_code}/interceptors with valid body
- **THEN** system creates interceptor with status ENABLED and returns 201 with full interceptor data

#### Scenario: Create interceptor with minimal fields

- **WHEN** admin submits POST with only required fields (name, embedded_site_id, event_name, entity_name, trigger)
- **THEN** system creates interceptor with default values (mode=observe, debounce_ms=1000, status=ENABLED)

#### Scenario: Create interceptor with invalid embedded_site_id

- **WHEN** admin submits POST with non-existent embedded_site_id
- **THEN** system returns 404 with code EMBEDDED_SITE_NOT_FOUND

#### Scenario: Create interceptor with invalid trigger JSON

- **WHEN** admin submits POST with malformed trigger JSON
- **THEN** system returns 400 with code TRIGGER_INVALID

#### Scenario: Create interceptor without entity_name

- **WHEN** admin submits POST without entity_name field
- **THEN** system returns 400 with code ENTITY_NAME_REQUIRED

### Requirement: List Interceptors

The system SHALL allow administrators to list interceptors with pagination and filtering.

#### Scenario: List all interceptors

- **WHEN** admin requests GET /api/v1/workspaces/{workspace_code}/interceptors
- **THEN** system returns paginated list with default page=1, page_size=50

#### Scenario: List interceptors filtered by embedded_site_id

- **WHEN** admin requests GET with embedded_site_id query parameter
- **THEN** system returns only interceptors belonging to that site

#### Scenario: List interceptors filtered by status

- **WHEN** admin requests GET with status=ENABLED
- **THEN** system returns only enabled interceptors

#### Scenario: List interceptors with search

- **WHEN** admin requests GET with name query parameter
- **THEN** system returns interceptors whose name contains the search term

### Requirement: Get Interceptor Detail

The system SHALL allow administrators to view interceptor details.

#### Scenario: Get existing interceptor

- **WHEN** admin requests GET /api/v1/workspaces/{workspace_code}/interceptors/{id}
- **THEN** system returns full interceptor data including trigger, before_actions, after_actions

#### Scenario: Get non-existent interceptor

- **WHEN** admin requests GET with invalid id
- **THEN** system returns 404 with code INTERCEPTOR_NOT_FOUND

### Requirement: Update Interceptor

The system SHALL allow administrators to update interceptor fields.

#### Scenario: Update interceptor fields

- **WHEN** admin submits PUT /api/v1/workspaces/{workspace_code}/interceptors/{id} with valid body
- **THEN** system updates fields and returns updated interceptor

#### Scenario: Update trigger.type syncs trigger_type

- **WHEN** admin updates trigger with new type value
- **THEN** system automatically syncs trigger_type field from trigger.type

#### Scenario: Update non-existent interceptor

- **WHEN** admin submits PUT with invalid id
- **THEN** system returns 404 with code INTERCEPTOR_NOT_FOUND

### Requirement: Delete Interceptor (Soft Delete)

The system SHALL soft-delete interceptors by changing status to DISABLED.

#### Scenario: Delete interceptor

- **WHEN** admin requests DELETE /api/v1/workspaces/{workspace_code}/interceptors/{id}
- **THEN** system sets status=DISABLED and returns 204 No Content

#### Scenario: Delete non-existent interceptor

- **WHEN** admin requests DELETE with invalid id
- **THEN** system returns 404 with code INTERCEPTOR_NOT_FOUND

### Requirement: Enable Interceptor

The system SHALL allow administrators to enable a disabled interceptor.

#### Scenario: Enable disabled interceptor

- **WHEN** admin requests POST /api/v1/workspaces/{workspace_code}/interceptors/{id}/enable
- **THEN** system sets status=ENABLED and returns updated interceptor

#### Scenario: Enable already enabled interceptor

- **WHEN** admin requests enable on an already ENABLED interceptor
- **THEN** system returns 200 with unchanged interceptor (idempotent)

### Requirement: Disable Interceptor

The system SHALL allow administrators to disable an enabled interceptor.

#### Scenario: Disable enabled interceptor

- **WHEN** admin requests POST /api/v1/workspaces/{workspace_code}/interceptors/{id}/disable
- **THEN** system sets status=DISABLED and returns updated interceptor

#### Scenario: Disable already disabled interceptor

- **WHEN** admin requests disable on an already DISABLED interceptor
- **THEN** system returns 200 with unchanged interceptor (idempotent)

### Requirement: Extension Query API

The system SHALL provide API for Chrome Extension to query enabled interceptors.

#### Scenario: Extension queries by site

- **WHEN** extension requests GET /api/v1/workspaces/{workspace_code}/interceptors?embedded_site_id=X&status=ENABLED
- **THEN** system returns only ENABLED interceptors for that site

#### Scenario: Extension receives complete rule data

- **WHEN** extension queries interceptors
- **THEN** response includes full trigger, before_actions, after_actions for rule execution
