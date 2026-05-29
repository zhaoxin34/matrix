## ADDED Requirements

### Requirement: List Embedded Sites
The system SHALL provide an API endpoint to list embedded sites for a workspace with pagination, search, and status filtering.

#### Scenario: List all sites with pagination
- **WHEN** user requests `GET /api/v1/workspaces/{workspace_code}/embedded-sites` without filters
- **THEN** system returns paginated list of embedded sites with default page size 20

#### Scenario: Filter by status
- **WHEN** user requests with `?status=enabled`
- **THEN** system returns only enabled embedded sites

#### Scenario: Search by name or URL
- **WHEN** user requests with `?search=crm`
- **THEN** system returns sites where site_name or site_url contains "crm"

### Requirement: Get Single Embedded Site
The system SHALL provide an API endpoint to retrieve a single embedded site by ID.

#### Scenario: Get existing site
- **WHEN** user requests `GET /api/v1/workspaces/{workspace_code}/embedded-sites/{id}`
- **THEN** system returns the embedded site details if found

#### Scenario: Get non-existent site
- **WHEN** user requests `GET /api/v1/workspaces/{workspace_code}/embedded-sites/{id}` with non-existent ID
- **THEN** system returns 404 error with code 2001

### Requirement: Create Embedded Site
The system SHALL provide an API endpoint to create a new embedded site within a workspace.

#### Scenario: Create site with valid data
- **WHEN** user submits `POST /api/v1/workspaces/{workspace_code}/embedded-sites` with valid site_name and site_url
- **THEN** system creates embedded site with status "disabled" and returns created site

#### Scenario: Create site with duplicate name
- **WHEN** user submits with site_name that already exists in the workspace
- **THEN** system returns 409 error with code 2002

#### Scenario: Create site with invalid URL
- **WHEN** user submits with invalid site_url format
- **THEN** system returns 400 error with code 1001

### Requirement: Update Embedded Site
The system SHALL provide an API endpoint to update an existing embedded site.

#### Scenario: Update site with valid data
- **WHEN** user submits `PUT /api/v1/workspaces/{workspace_code}/embedded-sites/{id}` with valid data
- **THEN** system updates the embedded site and returns updated data

#### Scenario: Update non-existent site
- **WHEN** user submits `PUT` with non-existent ID
- **THEN** system returns 404 error with code 2001

### Requirement: Delete Embedded Site
The system SHALL provide an API endpoint to delete an embedded site.

#### Scenario: Delete site without agents
- **WHEN** user requests `DELETE /api/v1/workspaces/{workspace_code}/embedded-sites/{id}` when no agents are linked
- **THEN** system soft-deletes the embedded site

#### Scenario: Delete site with linked agents
- **WHEN** user requests `DELETE` when agents are linked to the site
- **THEN** system returns 409 error with code 2003

### Requirement: Enable Embedded Site
The system SHALL provide an API endpoint to enable a disabled embedded site.

#### Scenario: Enable disabled site
- **WHEN** user requests `PATCH /api/v1/workspaces/{workspace_code}/embedded-sites/{id}/enable`
- **THEN** system sets status to "enabled" and returns updated data

#### Scenario: Enable already enabled site
- **WHEN** user requests `enable` on an already enabled site
- **THEN** system returns success without error (idempotent)

### Requirement: Disable Embedded Site
The system SHALL provide an API endpoint to disable an enabled embedded site.

#### Scenario: Disable enabled site
- **WHEN** user requests `PATCH /api/v1/workspaces/{workspace_code}/embedded-sites/{id}/disable`
- **THEN** system sets status to "disabled" and returns updated data

#### Scenario: Disable already disabled site
- **WHEN** user requests `disable` on an already disabled site
- **THEN** system returns success without error (idempotent)