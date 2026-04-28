# Skill Version Rollback

## ADDED Requirements

### Requirement: Rollback button visibility
The system SHALL display a "回滚" (Rollback) button next to each version in the history dialog.

### Requirement: Rollback confirmation
The system SHALL show a confirmation dialog before performing rollback asking user to confirm.

### Requirement: Rollback workflow
When user confirms rollback:
1. Copy the selected version's content to Skill.content
2. Update Skill.version to the selected version number
3. Skill.status remains unchanged (stays "active" or "draft" as was)

### Requirement: Rollback effect on versions
The system SHALL NOT delete any version records during rollback. The rollback creates a new state but preserves all historical versions.

---

### Requirement: Rollback from active to draft
If the skill was previously active and user rolls back to an older version, the skill remains active with the rolled-back content and version.

#### Scenario: Rollback active skill to older version
- **WHEN** user rolls back an active skill to an earlier version
- **THEN** Skill.content is updated with the older version's content
- **AND** Skill.version is updated to the rolled-back version number
- **AND** Skill.status remains "active"

### Requirement: View content before rollback
Before rolling back, user can view the full content of the version they are about to roll back to.

#### Scenario: View content then rollback
- **WHEN** user selects a version, views its content, and then clicks rollback
- **THEN** system shows confirmation dialog with the version number
- **AND** on confirm, performs the rollback as specified
