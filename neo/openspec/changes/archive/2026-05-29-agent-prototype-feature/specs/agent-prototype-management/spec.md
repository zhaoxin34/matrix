# Agent Prototype Management Specification

## ADDED Requirements

### Requirement: List Agent Prototypes
The system SHALL display a list of all Agent Prototypes with their ID, name, version, status, and creation time.

#### Scenario: View all prototypes
- **WHEN** admin accesses `/admin/agent-prototype`
- **THEN** system displays all prototypes in a table
- **AND** each row shows: ID, Name, Version, Status, Created At

#### Scenario: Filter by status
- **WHEN** admin clicks status filter (All/Draft/Enabled/Disabled)
- **THEN** system displays only prototypes matching the selected status

#### Scenario: Search by name
- **WHEN** admin enters search keyword in search box
- **THEN** system displays prototypes with names containing the keyword

### Requirement: Create Agent Prototype
The system SHALL allow admin to create a new Agent Prototype with name, description, and prompts.

#### Scenario: Successful creation
- **WHEN** admin fills in required fields (name, prompts) and clicks "Save Draft"
- **THEN** system creates prototype with status=DRAFT
- **AND** system redirects to prototype detail page
- **AND** system displays success message

#### Scenario: Creation with missing name
- **WHEN** admin submits form without name
- **THEN** system displays validation error "Name is required"
- **AND** creation is rejected

#### Scenario: Creation with empty prompts
- **WHEN** admin submits form without prompts content
- **THEN** system displays validation error "Prompts is required"
- **AND** creation is rejected

### Requirement: View Agent Prototype Detail
The system SHALL display complete information about a specific Prototype.

#### Scenario: View detail page
- **WHEN** admin accesses `/admin/agent-prototype/{id}`
- **THEN** system displays: ID, Name, Version, Status, Created At
- **AND** system displays current prompts content
- **AND** system shows action buttons based on status

#### Scenario: Actions for draft status
- **WHEN** prototype status is DRAFT
- **THEN** system displays buttons: Edit, Publish, Delete

#### Scenario: Actions for enabled status
- **WHEN** prototype status is ENABLED
- **THEN** system displays buttons: Edit, Disable, History

#### Scenario: Actions for disabled status
- **WHEN** prototype status is DISABLED
- **THEN** system displays buttons: Enable, History

### Requirement: Edit Agent Prototype
The system SHALL allow admin to edit prototype prompts and configuration.

#### Scenario: Edit via detail page
- **WHEN** admin clicks "Edit" button on prototype detail
- **THEN** system redirects to `/admin/agent-prototype/{id}/edit`

#### Scenario: Save draft edits
- **WHEN** admin modifies prompts and clicks "Save Draft"
- **THEN** system updates prompts content
- **AND** version remains unchanged
- **AND** status remains unchanged
- **AND** system displays success message

#### Scenario: Cancel edit
- **WHEN** admin clicks "Cancel" button
- **THEN** system discards changes
- **AND** system redirects back to prototype detail

### Requirement: Delete Agent Prototype
The system SHALL allow admin to delete draft prototypes only.

#### Scenario: Delete draft prototype
- **WHEN** admin clicks "Delete" on a DRAFT prototype
- **THEN** system displays confirmation dialog
- **WHEN** admin confirms deletion
- **THEN** system removes prototype from database
- **AND** system redirects to prototype list

#### Scenario: Delete non-draft prototype
- **WHEN** admin attempts to delete ENABLED or DISABLED prototype
- **THEN** system does not display delete button
- **OR** system displays error "Only draft prototypes can be deleted"

### Requirement: Disable Agent Prototype
The system SHALL allow admin to disable an enabled prototype.

#### Scenario: Disable enabled prototype
- **WHEN** admin clicks "Disable" button
- **THEN** system updates status to DISABLED
- **AND** button changes to "Enable"

#### Scenario: Disable non-enabled prototype
- **WHEN** admin attempts to disable DRAFT or DISABLED prototype
- **THEN** system does not allow the action

### Requirement: Enable Agent Prototype
The system SHALL allow admin to re-enable a disabled prototype.

#### Scenario: Enable disabled prototype
- **WHEN** admin clicks "Enable" button
- **THEN** system updates status to ENABLED
- **AND** button changes to "Disable"

#### Scenario: Enable non-disabled prototype
- **WHEN** admin attempts to enable DRAFT or ENABLED prototype
- **THEN** system does not allow the action

### Requirement: Admin permission control
The system SHALL restrict prototype management access to admin users only.

#### Scenario: Non-admin access to list
- **WHEN** non-admin user accesses `/admin/agent-prototype`
- **THEN** system returns 401 Unauthorized or 403 Forbidden

#### Scenario: Non-admin access to create
- **WHEN** non-admin user accesses `/admin/agent-prototype/new`
- **THEN** system returns 401 Unauthorized or 403 Forbidden

#### Scenario: Non-admin API call
- **WHEN** non-admin user calls any `/api/v1/agent_prototype` endpoint
- **THEN** system returns 401 Unauthorized or 403 Forbidden