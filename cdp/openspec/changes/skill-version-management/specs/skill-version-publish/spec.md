# Skill Version Publish

## ADDED Requirements

### Requirement: Publish button visibility
The system SHALL display a "发布" (Publish) button in the skill list for skills with draft status.

### Requirement: Publish dialog
The system SHALL show a dialog when user clicks the Publish button containing:
- Version number input field (required)
- Comment textarea (required)
- Cancel and Confirm buttons

### Requirement: Version number uniqueness
The system SHALL validate that the version number does not already exist for this skill before publishing.

### Requirement: Publish workflow
When user confirms publish:
1. Copy Skill.content (draft) to SkillVersion.content
2. Set Skill.version to the submitted version number
3. Set Skill.status to "active"
4. Record the submitted comment in SkillVersion.comment

### Requirement: Publish validation
The system SHALL prevent publishing when:
- Version number is empty
- Comment is empty
- Version number already exists for this skill

### Requirement: Publish from draft or content edit
The system SHALL allow publishing from:
- Step 2 of creation wizard (content just edited)
- Edit content dialog (content just edited)

---

### Requirement: Active skill re-publish
An active skill can be published again after content is edited.

#### Scenario: Re-publish after content edit
- **WHEN** user edits content of an active skill and publishes again
- **THEN** a new version record is created with a new version number
- **AND** Skill.version is updated to the new version number

### Requirement: Draft skill first publish
A draft skill can be published for the first time.

#### Scenario: First publish from draft
- **WHEN** user publishes a draft skill that has no published versions
- **THEN** a new version record is created
- **AND** Skill.status changes from "draft" to "active"
- **AND** Skill.version is set to the submitted version number
