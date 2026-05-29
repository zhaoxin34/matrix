# Agent Prototype Versioning Specification

## ADDED Requirements

### Requirement: Publish Agent Prototype
The system SHALL allow admin to publish prototype drafts as new versions.

#### Scenario: Publish with valid data
- **WHEN** admin clicks "Publish" button on prototype detail
- **THEN** system displays publish dialog with version number (auto-generated) and change summary field
- **WHEN** admin fills in change summary and confirms
- **THEN** system creates version snapshot in `agent_prototype_version` table
- **AND** system updates prototype version to new version number
- **AND** system updates prototype status to ENABLED
- **AND** system closes dialog
- **AND** system displays success message

#### Scenario: Publish without change summary
- **WHEN** admin attempts to confirm publish without change summary
- **THEN** system displays validation error "Change summary is required"
- **AND** publish is rejected

#### Scenario: Publish with empty prompts
- **WHEN** admin attempts to publish prototype with empty prompts
- **THEN** system displays validation error "Prompts cannot be empty"
- **AND** publish is rejected

### Requirement: View Version History
The system SHALL allow admin to view all historical versions of a prototype.

#### Scenario: View version history dialog
- **WHEN** admin clicks "History" button on prototype detail
- **THEN** system displays dialog with version history list
- **AND** each entry shows: version number, created at, change summary, created by

#### Scenario: Version history ordered by time
- **WHEN** admin views version history
- **THEN** versions are displayed in descending order (newest first)
- **AND** current version is marked as "Current Version"

### Requirement: Rollback to Historical Version
The system SHALL allow admin to rollback prototype to any historical version.

#### Scenario: Rollback to specific version
- **WHEN** admin clicks "Rollback" on a historical version
- **THEN** system displays confirmation dialog
- **WHEN** admin confirms rollback
- **THEN** system copies prompts_snapshot from selected version to prototype
- **AND** system copies config_snapshot from selected version to prototype
- **AND** system updates prototype version to rolled-back version number
- **AND** system creates a new version entry marking this as rollback
- **AND** system closes dialog
- **AND** system displays success message

#### Scenario: Rollback does not delete source version
- **WHEN** admin rolls back to version X
- **THEN** version X remains in history
- **AND** a new version entry is created for rollback operation

#### Scenario: Cannot rollback to current version
- **WHEN** admin views version history
- **THEN** current version does not show "Rollback" button

### Requirement: Version Number Auto-Increment
The system SHALL automatically assign version numbers following semantic versioning.

#### Scenario: First publish assigns 1.0.0
- **WHEN** prototype is published for the first time
- **THEN** system assigns version "1.0.0"

#### Scenario: Subsequent publish increments patch version
- **WHEN** prototype at version "1.0.0" is published
- **THEN** system assigns version "1.0.1"

#### Scenario: Version increments only on publish
- **WHEN** admin edits prototype prompts
- **THEN** version number remains unchanged until published

### Requirement: Version Snapshot Contains Complete State
The system SHALL preserve complete prototype state in version snapshot.

#### Scenario: Snapshot includes prompts
- **WHEN** prototype is published
- **THEN** version record includes prompts_snapshot with complete prompts JSON

#### Scenario: Snapshot includes config
- **WHEN** prototype is published
- **THEN** version record includes config_snapshot with complete config JSON

#### Scenario: Snapshot includes metadata
- **WHEN** prototype is published
- **THEN** version record includes: version number, change summary, created_by, created_at

### Requirement: Rollback Preserves Audit Trail
The system SHALL maintain complete audit trail for all rollback operations.

#### Scenario: Rollback creates new version entry
- **WHEN** admin rolls back to version X
- **THEN** system creates new version entry with change_summary="Rollback to version X"
- **AND** created_by records who performed the rollback

#### Scenario: Multiple rollbacks tracked
- **WHEN** admin rolls back multiple times
- **THEN** each rollback creates a new version entry
- **AND** version history shows complete rollback sequence