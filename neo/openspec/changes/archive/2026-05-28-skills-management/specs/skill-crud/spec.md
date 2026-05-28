---
id: skill-crud
title: Skill CRUD 操作规格
change: skills-management
---

## ADDED Requirements

### Requirement: Create Skill
The system SHALL allow users to create a new Skill with code, name, level, and tags.

#### Scenario: Create skill successfully
- **WHEN** user submits a valid POST request to `/api/v1/skills` with code, name, level, and tags
- **THEN** the system creates a new Skill with status "draft" and returns the Skill details

#### Scenario: Create skill with duplicate code
- **WHEN** user submits a POST request to `/api/v1/skills` with an existing code
- **THEN** the system returns HTTP 409 Conflict with error code 4001

#### Scenario: Create skill with invalid level
- **WHEN** user submits a POST request to `/api/v1/skills` with an invalid level value
- **THEN** the system returns HTTP 400 Bad Request with error code 1001

### Requirement: List Skills
The system SHALL allow users to list all Skills with pagination and filtering.

#### Scenario: List skills with default pagination
- **WHEN** user sends a GET request to `/api/v1/skills` without parameters
- **THEN** the system returns a paginated list with page=1, page_size=20

#### Scenario: List skills with status filter
- **WHEN** user sends a GET request to `/api/v1/skills?status=active`
- **THEN** the system returns only skills with status "active"

#### Scenario: List skills with level filter
- **WHEN** user sends a GET request to `/api/v1/skills?level=Functional`
- **THEN** the system returns only skills with level "Functional"

#### Scenario: List skills with tags filter
- **WHEN** user sends a GET request to `/api/v1/skills?tags=data,analysis`
- **THEN** the system returns only skills containing all specified tags

#### Scenario: List skills with search
- **WHEN** user sends a GET request to `/api/v1/skills?search=hello`
- **THEN** the system returns skills whose name or code contains "hello"

### Requirement: Get Skill Detail
The system SHALL allow users to get the details of a specific Skill.

#### Scenario: Get skill detail successfully
- **WHEN** user sends a GET request to `/api/v1/skills/{code}`
- **THEN** the system returns the Skill details including draft_snapshot and current_version

#### Scenario: Get skill detail with invalid code
- **WHEN** user sends a GET request to `/api/v1/skills/{invalid-code}`
- **THEN** the system returns HTTP 404 Not Found

### Requirement: Update Skill
The system SHALL allow users to update Skill metadata (name, level, tags).

#### Scenario: Update skill name
- **WHEN** user sends a PATCH request to `/api/v1/skills/{code}` with a new name
- **THEN** the system updates the Skill name and returns the updated Skill

#### Scenario: Update skill level
- **WHEN** user sends a PATCH request to `/api/v1/skills/{code}` with a new level
- **THEN** the system updates the Skill level and returns the updated Skill

#### Scenario: Update skill tags
- **WHEN** user sends a PATCH request to `/api/v1/skills/{code}` with new tags
- **THEN** the system updates the Skill tags and returns the updated Skill

#### Scenario: Update immutable fields
- **WHEN** user sends a PATCH request to `/api/v1/skills/{code}` with code field
- **THEN** the system ignores the code field and returns success

### Requirement: Delete Skill
The system SHALL allow users to soft-delete a Skill.

#### Scenario: Delete draft skill
- **WHEN** user sends a DELETE request to `/api/v1/skills/{code}` for a draft Skill
- **THEN** the system sets deleted_at timestamp and returns success

#### Scenario: Delete active skill
- **WHEN** user sends a DELETE request to `/api/v1/skills/{code}` for an active Skill
- **THEN** the system returns HTTP 400 Bad Request with error message "Cannot delete active Skill"

#### Scenario: Delete already deleted skill
- **WHEN** user sends a DELETE request to `/api/v1/skills/{code}` for an already deleted Skill
- **THEN** the system returns HTTP 404 Not Found