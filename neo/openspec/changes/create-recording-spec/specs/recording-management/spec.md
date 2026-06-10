## ADDED Requirements

### Requirement: List recordings
The system SHALL provide an API to list all recordings within a workspace. The list SHALL support pagination, sorting, and filtering by tags, status, and date range.

#### Scenario: List recordings with pagination
- **WHEN** user requests GET /api/v1/workspaces/{workspace_code}/recordings with page=1&size=20
- **THEN** system returns paginated recording list with total count

#### Scenario: Filter recordings by tags
- **WHEN** user requests GET /api/v1/workspaces/{workspace_code}/recordings with tags=demo,test
- **THEN** system returns only recordings that contain all specified tags

#### Scenario: Search recordings by name
- **WHEN** user requests GET /api/v1/workspaces/{workspace_code}/recordings with q=login
- **THEN** system returns recordings whose name contains "login"

### Requirement: View recording details
The system SHALL provide an API to retrieve detailed information about a recording, including all its segments with pageUrls.

#### Scenario: Get recording with segments
- **WHEN** user requests GET /api/v1/workspaces/{workspace_code}/recordings/{uid}
- **THEN** system returns recording details including array of segments with sequence, startTime, endTime, pageUrls

### Requirement: Update recording metadata
The system SHALL allow users to update recording name and tags.

#### Scenario: Rename recording
- **WHEN** user requests PUT /api/v1/workspaces/{workspace_code}/recordings/{uid} with name="New Name"
- **THEN** system updates recording name and returns success

#### Scenario: Update recording tags
- **WHEN** user requests PUT /api/v1/workspaces/{workspace_code}/recordings/{uid} with tags=["demo","learning"]
- **THEN** system replaces recording tags with new values

### Requirement: Delete recording
The system SHALL allow users to delete a recording. Deletion SHALL also remove all associated segments from S3 storage.

#### Scenario: Delete recording with confirmation
- **WHEN** user confirms deletion of recording
- **THEN** system removes recording and all segments from database and S3

### Requirement: Batch operations
The system SHALL support batch operations for multiple recordings: batch delete and batch tag management.

#### Scenario: Batch delete recordings
- **WHEN** user requests DELETE /api/v1/workspaces/{workspace_code}/recordings/batch with uids=["uid1","uid2"]
- **THEN** system deletes all specified recordings and their segments

#### Scenario: Batch add tags
- **WHEN** user requests PUT /api/v1/workspaces/{workspace_code}/recordings/batch/tags with action=add&tags=["demo"]&uids=["uid1","uid2"]
- **THEN** system adds "demo" tag to all specified recordings

#### Scenario: Batch remove tags
- **WHEN** user requests PUT /api/v1/workspaces/{workspace_code}/recordings/batch/tags with action=remove&tags=["demo"]&uids=["uid1"]
- **THEN** system removes "demo" tag from specified recording

### Requirement: Complete recording
The system SHALL allow users to mark a recording as completed, which finalizes its status and prevents further segment additions.

#### Scenario: Complete recording
- **WHEN** user requests PUT /api/v1/workspaces/{workspace_code}/recordings/{uid} with status="completed", exitUrl, totalDuration
- **THEN** system updates recording status to completed and records exitUrl and totalDuration

### Requirement: Recording status management
The system SHALL support three recording statuses: recording (in progress), completed, and failed.

#### Scenario: Recording status transitions
- **WHEN** recording is created
- **THEN** status is set to "recording"

#### Scenario: Mark recording as failed
- **WHEN** user or system marks recording as failed
- **THEN** status is set to "failed" and recording cannot accept new segments