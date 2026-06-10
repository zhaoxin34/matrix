## ADDED Requirements

### Requirement: Create recording
The system SHALL provide an API to create a new recording. The API SHALL return a unique UID for the recording.

#### Scenario: Create recording for agent recording
- **WHEN** user requests POST /api/v1/workspaces/{workspace_code}/recordings with enterUrl
- **THEN** system creates recording with status="recording" and returns uid

#### Scenario: Create recording for manual upload
- **WHEN** user requests POST /api/v1/workspaces/{workspace_code}/recordings with source="upload"
- **THEN** system creates recording with source="upload" and status="recording"

### Requirement: Upload segment
The system SHALL provide an API to create a segment associated with a recording. Each segment SHALL be assigned a sequence number automatically.

#### Scenario: Create segment for recording
- **WHEN** user requests POST /api/v1/workspaces/{workspace_code}/recordings/{uid}/segments with startTime, endTime, pageUrls, storageKey, size
- **THEN** system creates segment with next sequence number and returns segment uid

#### Scenario: Segment sequence auto-increment
- **WHEN** user creates multiple segments for same recording
- **THEN** each segment receives sequential sequence numbers starting from 1

### Requirement: Get presigned upload URL
The system SHALL provide an API to generate a presigned URL for uploading segment files to S3.

#### Scenario: Request upload URL
- **WHEN** user requests POST /api/v1/workspaces/{workspace_code}/recordings/{uid}/segments/presigned with filename and contentType
- **THEN** system returns presigned upload URL and storage key valid for 1 hour

### Requirement: Get presigned download URL
The system SHALL provide an API to generate a presigned URL for downloading segment files from S3.

#### Scenario: Request download URL
- **WHEN** user requests GET /api/v1/workspaces/{workspace_code}/recordings/{uid}/segments/{segmentUid}/download-url
- **THEN** system returns presigned download URL valid for 1 hour

### Requirement: List segments
The system SHALL provide an API to list all segments of a recording.

#### Scenario: Get segments for recording
- **WHEN** user requests GET /api/v1/workspaces/{workspace_code}/recordings/{uid}/segments
- **THEN** system returns all segments sorted by sequence number

### Requirement: S3 storage path
The system SHALL store segment files in S3 with path pattern: recordings/{workspace_id}/{recording_id}/{segment_uid}.rrweb.json

#### Scenario: Generate storage path
- **WHEN** segment is created
- **THEN** storageKey is set to recordings/{workspace_id}/{recording_id}/{segment_uid}.rrweb.json

### Requirement: Two upload modes
The system SHALL support two upload modes: agent recording (real-time upload from Chrome extension) and manual upload (user uploads files through web interface).

#### Scenario: Agent recording mode
- **WHEN** recording is created with source="agent"
- **THEN** segments are uploaded every 10 minutes during recording session

#### Scenario: Manual upload mode
- **WHEN** recording is created with source="upload"
- **THEN** user can upload segment files manually through web interface