# Event Management Specification

## ADDED Requirements

### Requirement: Event List Display

The system SHALL display a paginated list of events for the current workspace, showing event name, entity, actor, timestamp, and metadata preview.

#### Scenario: View event list with pagination

- **WHEN** user navigates to `/workspace/{workspace_code}/events`
- **THEN** system displays events in descending order by timestamp with pagination controls (20 items per page)

#### Scenario: Filter events by name

- **WHEN** user enters a search term in the name filter field
- **THEN** system displays only events whose name contains the search term (case-insensitive)

#### Scenario: Filter events by entity

- **WHEN** user enters an entity name in the entity filter field
- **THEN** system displays only events with exact matching entity_name

#### Scenario: Filter events by actor

- **WHEN** user enters a search term in the actor filter field
- **THEN** system displays only events whose actor contains the search term (case-insensitive)

#### Scenario: Filter events by time range

- **WHEN** user selects a start and end date in the timestamp filter
- **THEN** system displays only events with timestamp within the selected range

### Requirement: Event Detail View

The system SHALL display complete event information including all metadata when user views event details.

#### Scenario: View event detail

- **WHEN** user clicks on an event in the list or navigates to `/workspace/{workspace_code}/events/{id}`
- **THEN** system displays all event fields including id, name, entity_name, target_entity_name, actor, timestamp, page_url, session_id, metadata, created_by, created_at, updated_at

### Requirement: Create Event

The system SHALL allow users to create new events with required and optional fields.

#### Scenario: Create event with all fields

- **WHEN** user fills all required fields (name, entity_name, actor, timestamp) and optional fields (target_entity_name, page_url, session_id, metadata), then clicks "Create"
- **THEN** system creates the event and displays success message, redirecting to event list

#### Scenario: Create event with only required fields

- **WHEN** user fills only required fields (name, entity_name, actor, timestamp), then clicks "Create"
- **THEN** system creates the event with default values for optional fields and displays success message

#### Scenario: Validation error on empty required field

- **WHEN** user attempts to create event without filling name field
- **THEN** system displays validation error "事件名称不能为空" and prevents form submission

#### Scenario: Validation error on invalid entity format

- **WHEN** user enters entity_name not matching format `{type}_{id}`
- **THEN** system displays validation error "实体名称格式不正确"

### Requirement: Edit Event

The system SHALL allow users to edit existing event information.

#### Scenario: Edit event successfully

- **WHEN** user navigates to `/workspace/{workspace_code}/events/{id}/edit`, modifies fields, and clicks "Save"
- **THEN** system updates the event and displays success message

#### Scenario: Validation errors on edit

- **WHEN** user modifies required fields to invalid values
- **THEN** system displays appropriate validation errors

### Requirement: Delete Event

The system SHALL allow users to delete events with hard deletion (no recovery).

#### Scenario: Delete event with confirmation

- **WHEN** user clicks delete button and confirms deletion in dialog
- **THEN** system permanently deletes the event and removes it from list

#### Scenario: Delete event cancelled

- **WHEN** user clicks delete button but cancels in confirmation dialog
- **THEN** system does not delete the event
