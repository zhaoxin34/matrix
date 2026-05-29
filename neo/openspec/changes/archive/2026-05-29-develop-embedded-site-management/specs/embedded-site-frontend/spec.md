## ADDED Requirements

### Requirement: Embedded Sites List Page
The system SHALL provide a list page for managing embedded sites at `/workspace/{workspace_code}/embedded-sites`.

#### Scenario: Display list with pagination
- **WHEN** user navigates to the list page
- **THEN** system displays paginated list of embedded sites with 20 items per page

#### Scenario: Filter by status
- **WHEN** user selects status filter (enabled/disabled)
- **THEN** system displays only sites matching the selected status

#### Scenario: Search sites
- **WHEN** user enters search keyword
- **THEN** system displays sites where site_name or site_url contains the keyword

### Requirement: Create Embedded Site Page
The system SHALL provide a creation page at `/workspace/{workspace_code}/embedded-sites/new`.

#### Scenario: Display create form
- **WHEN** user navigates to create page
- **THEN** system displays form with site_name, site_url, and description fields

#### Scenario: Submit valid form
- **WHEN** user submits form with valid data
- **THEN** system creates site and redirects to list page with success message

#### Scenario: Submit invalid form
- **WHEN** user submits form with missing required fields
- **THEN** system displays validation errors inline

### Requirement: Edit Embedded Site Page
The system SHALL provide an edit page at `/workspace/{workspace_code}/embedded-sites/{id}/edit`.

#### Scenario: Display edit form with data
- **WHEN** user navigates to edit page
- **THEN** system pre-fills form with existing site data

#### Scenario: Update site successfully
- **WHEN** user submits updated data
- **THEN** system updates site and redirects to list page with success message

### Requirement: Toggle Site Status
The system SHALL provide UI controls to enable or disable embedded sites.

#### Scenario: Enable site from list
- **WHEN** user clicks enable button on a disabled site
- **THEN** system sends enable API request and updates site status in UI

#### Scenario: Disable site from list
- **WHEN** user clicks disable button on an enabled site
- **THEN** system sends disable API request and updates site status in UI