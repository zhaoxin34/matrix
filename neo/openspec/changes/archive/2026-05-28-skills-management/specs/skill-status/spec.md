---
id: skill-status
title: Skill 状态管理规格
change: skills-management
---

## ADDED Requirements

### Requirement: Skill Status Machine
The system SHALL enforce the status state machine: draft → active → disabled (one-way, irreversible).

#### Scenario: New skill has draft status
- **WHEN** a user creates a new Skill
- **THEN** the Skill status is set to "draft"

#### Scenario: Draft skill can be edited
- **WHEN** a user edits a Skill with status "draft"
- **THEN** the system allows file creation, update, and deletion

#### Scenario: Active skill can be edited
- **WHEN** a user edits a Skill with status "active"
- **THEN** the system allows file creation, update, and deletion

#### Scenario: Disabled skill cannot be edited
- **WHEN** a user attempts to edit a Skill with status "disabled"
- **THEN** the system returns HTTP 403 Forbidden

### Requirement: Publish Changes Status
The system SHALL change Skill status to "active" when published.

#### Scenario: Publish updates status to active
- **WHEN** a user successfully publishes a Skill
- **THEN** the Skill status changes from "draft" to "active"

#### Scenario: Re-publish maintains active status
- **WHEN** a user publishes a Skill that is already active
- **THEN** the Skill status remains "active"

### Requirement: Disable Skill
The system SHALL allow administrators to disable an active Skill.

#### Scenario: Disable active skill
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/disable`
- **THEN** the system changes Skill status to "disabled"

#### Scenario: Disable draft skill
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/disable`
- **THEN** the system changes Skill status to "disabled"

#### Scenario: Disable already disabled skill
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/disable` for a disabled Skill
- **THEN** the system returns HTTP 400 Bad Request

#### Scenario: Disabled skill cannot be called
- **WHEN** a user attempts to invoke a disabled Skill
- **THEN** the system returns HTTP 403 Forbidden

### Requirement: Enable Skill
The system SHALL allow administrators to enable a disabled Skill.

#### Scenario: Enable disabled skill
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/enable`
- **THEN** the system changes Skill status to "active"

#### Scenario: Enable active skill
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/enable` for an active Skill
- **THEN** the system returns HTTP 400 Bad Request

#### Scenario: Enable draft skill
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/enable` for a draft Skill
- **THEN** the system returns HTTP 400 Bad Request