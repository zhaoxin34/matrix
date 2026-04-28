# Skill Version History

## ADDED Requirements

### Requirement: History button visibility
The system SHALL display a "历史" (History) button in the skill list for all skills.

### Requirement: History dialog
The system SHALL show a dialog when user clicks the History button containing:
- A list of all published versions for this skill
- Each list item shows: version number, comment, created date
- Version list is sorted by creation date (newest first)

### Requirement: View version detail
The system SHALL allow user to view the content of any historical version.

#### Scenario: View version content from history
- **WHEN** user clicks on a version in the history list
- **THEN** system displays the content of that version
- **AND** displays a note indicating this is a historical version

### Requirement: History dialog close
The system SHALL close the history dialog when user clicks the close button or clicks outside the dialog.

---

### Requirement: Empty version history
When a skill has no published versions (draft status), the history dialog SHALL show an empty state message.

#### Scenario: Empty history for draft skill
- **WHEN** user opens history dialog for a draft skill with no published versions
- **THEN** system displays message "暂无发布记录"
- **AND** no version list is shown
