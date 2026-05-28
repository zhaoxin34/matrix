---
id: skill-files
title: Skill 文件管理规格
change: skills-management
---

## ADDED Requirements

### Requirement: Get File Tree
The system SHALL allow users to get the file tree structure of a Skill.

#### Scenario: Get file tree successfully
- **WHEN** user sends a GET request to `/api/v1/skills/{code}/files`
- **THEN** the system returns a hierarchical tree structure with files and directories

#### Scenario: Get file tree with empty skill
- **WHEN** user sends a GET request to `/api/v1/skills/{code}/files` for a Skill with no files
- **THEN** the system returns an empty array

#### Scenario: Get file tree with nested directories
- **WHEN** user sends a GET request to `/api/v1/skills/{code}/files` for a Skill with nested directories
- **THEN** the system returns a tree with proper nesting (e.g., scripts/file1.sh under scripts directory)

### Requirement: Get File Content
The system SHALL allow users to get the content of a specific file.

#### Scenario: Get file content successfully
- **WHEN** user sends a GET request to `/api/v1/skills/{code}/files/{path}`
- **THEN** the system returns the file metadata and content

#### Scenario: Get file content with URL-encoded path
- **WHEN** user sends a GET request to `/api/v1/skills/{code}/files/scripts%2Ffile1.sh`
- **THEN** the system returns the file content for "scripts/file1.sh"

#### Scenario: Get non-existent file
- **WHEN** user sends a GET request to `/api/v1/skills/{code}/files/non-existent.md`
- **THEN** the system returns HTTP 404 Not Found

### Requirement: Create File
The system SHALL allow users to create a new file in a Skill.

#### Scenario: Create file at root
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/files` with path="README.md" and content
- **THEN** the system creates the file and updates draft_snapshot

#### Scenario: Create file in subdirectory
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/files` with path="scripts/new.sh" and content
- **THEN** the system creates the file and updates draft_snapshot

#### Scenario: Create file with duplicate path
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/files` with an existing path
- **THEN** the system returns HTTP 409 Conflict with error code 4004

#### Scenario: Create file with empty content
- **WHEN** user sends a POST request to `/api/v1/skills/{code}/files` with empty content
- **THEN** the system returns HTTP 400 Bad Request with error code 1001

### Requirement: Update File
The system SHALL allow users to update the content of an existing file.

#### Scenario: Update file content
- **WHEN** user sends a PUT request to `/api/v1/skills/{code}/files/{path}` with new content
- **THEN** the system creates a new File record with incremented version and updates draft_snapshot

#### Scenario: Update non-existent file
- **WHEN** user sends a PUT request to `/api/v1/skills/{code}/files/non-existent.md`
- **THEN** the system returns HTTP 404 Not Found

### Requirement: Delete File
The system SHALL allow users to delete a file from a Skill.

#### Scenario: Delete file from draft
- **WHEN** user sends a DELETE request to `/api/v1/skills/{code}/files/{path}` for a draft Skill
- **THEN** the system removes the file from draft_snapshot

#### Scenario: Delete file from active skill
- **WHEN** user sends a DELETE request to `/api/v1/skills/{code}/files/{path}` for an active Skill
- **THEN** the system returns HTTP 400 Bad Request with error code 4005 "Cannot delete files from active Skill"

#### Scenario: Delete non-existent file
- **WHEN** user sends a DELETE request to `/api/v1/skills/{code}/files/non-existent.md`
- **THEN** the system returns HTTP 404 Not Found