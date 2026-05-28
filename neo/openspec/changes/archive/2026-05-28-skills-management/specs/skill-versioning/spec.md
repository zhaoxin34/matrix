---
id: skill-versioning
title: Skill 版本管理规格
change: skills-management
---

## ADDED Requirements

### Requirement: Publish Skill
The system SHALL allow users to publish a Skill, creating a new version.

#### Scenario: Publish draft skill successfully
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/publish` with version and comment
- **THEN** the system creates a SkillVersion record and updates Skill status to "active"

#### Scenario: Publish with duplicate version
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/publish` with an existing version
- **THEN** the system returns HTTP 409 Conflict with error code 4002

#### Scenario: Publish with empty comment
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/publish` with empty comment
- **THEN** the system returns HTTP 400 Bad Request with error code 1001

#### Scenario: Publish with empty draft
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/publish` with no files in draft_snapshot
- **THEN** the system returns HTTP 400 Bad Request with error code 4003

### Requirement: Get Version History
The system SHALL allow users to view the version history of a Skill.

#### Scenario: Get version history
- **WHEN** user sends a GET request to `/api/v1/skills/{code}/versions`
- **THEN** the system returns a list of all SkillVersion records sorted by created_at desc

#### Scenario: Get version history with no versions
- **WHEN** user sends a GET request to `/api/v1/skills/{code}/versions` for a Skill with no published versions
- **THEN** the system returns an empty list

#### Scenario: Get version history marks current version
- **WHEN** user sends a GET request to `/api/v1/skills/{code}/versions`
- **THEN** the most recent version has is_current=true and others have is_current=false

### Requirement: Rollback Skill
The system SHALL allow users to rollback to a previous version.

#### Scenario: Rollback to previous version
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/rollback` with version_id
- **THEN** the system copies the file_snapshot to draft_snapshot and returns success

#### Scenario: Rollback to non-existent version
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/rollback` with non-existent version_id
- **THEN** the system returns HTTP 404 Not Found

#### Scenario: Rollback does not delete versions
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/rollback`
- **THEN** the existing SkillVersion records remain unchanged

#### Scenario: Rollback allows re-publishing
- **WHEN** user successfully rolls back a Skill
- **THEN** the user can edit the draft and re-publish with a new version