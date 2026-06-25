# Status Management Specification

## ADDED Requirements

### Requirement: Status List Display

The system SHALL display a paginated list of status records for the current workspace, showing entity name, captured_at time, source, and attributes preview.

#### Scenario: View status list with pagination

- **WHEN** user navigates to `/workspace/{workspace_code}/status`
- **THEN** system displays status records in descending order by captured_at with pagination controls (20 items per page)

#### Scenario: Filter status by entity

- **WHEN** user enters an entity name in the entity filter field
- **THEN** system displays only status records with exact matching entity_name

#### Scenario: Filter status by time range

- **WHEN** user selects a start and end date in the captured_at filter
- **THEN** system displays only status records with captured_at within the selected range

#### Scenario: Filter status by source

- **WHEN** user selects a source from the dropdown filter
- **THEN** system displays only status records with matching source

### Requirement: Status Detail View

The system SHALL display complete status information including all attributes when user views status details.

#### Scenario: View status detail

- **WHEN** user clicks on a status record in the list or navigates to `/workspace/{workspace_code}/status/{id}`
- **THEN** system displays all status fields including id, entity_name, attributes (as formatted JSON), captured_at, source, session_id, created_by, created_at, updated_at

### Requirement: Create Status

The system SHALL allow users to create new status records with required and optional fields.

#### Scenario: Create status with all fields

- **WHEN** user fills all required fields (entity_name, attributes, captured_at) and optional fields (source, session_id), then clicks "Create"
- **THEN** system creates the status record and displays success message, redirecting to status list

#### Scenario: Create status with only required fields

- **WHEN** user fills only required fields (entity_name, attributes, captured_at), then clicks "Create"
- **THEN** system creates the status record with default values for optional fields and displays success message

#### Scenario: Validation error on empty entity_name

- **WHEN** user attempts to create status without filling entity_name field
- **THEN** system displays validation error and prevents form submission

#### Scenario: Validation error on empty attributes

- **WHEN** user attempts to create status without filling attributes field
- **THEN** system displays validation error "属性不能为空" and prevents form submission

#### Scenario: Validation error on invalid attributes JSON

- **WHEN** user enters invalid JSON in the attributes field
- **THEN** system displays validation error "属性格式不正确" and prevents form submission

### Requirement: Edit Status

The system SHALL allow users to edit existing status information.

#### Scenario: Edit status successfully

- **WHEN** user navigates to `/workspace/{workspace_code}/status/{id}/edit`, modifies fields, and clicks "Save"
- **THEN** system updates the status record and displays success message

#### Scenario: Validation errors on edit

- **WHEN** user modifies required fields to invalid values
- **THEN** system displays appropriate validation errors

### Requirement: Delete Status

The system SHALL allow users to delete status records with hard deletion (no recovery).

#### Scenario: Delete status with confirmation

- **WHEN** user clicks delete button and confirms deletion in dialog
- **THEN** system permanently deletes the status record and removes it from list

#### Scenario: Delete status cancelled

- **WHEN** user clicks delete button but cancels in confirmation dialog
- **THEN** system does not delete the status record
