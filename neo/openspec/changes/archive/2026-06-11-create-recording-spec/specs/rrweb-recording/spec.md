## MODIFIED Requirements

### Requirement: Recording Session Management
The system SHALL provide recording session management including start, stop, pause, and resume capabilities.

#### Scenario: Start recording session
- **WHEN** user selects "Learn Mode" from popup
- **THEN** system SHALL initialize rrweb recorder with default configuration
- **AND** system SHALL create a new session ID (UUID)
- **AND** system SHALL set recording state to active
- **AND** system SHALL call POST /api/v1/workspaces/{code}/recordings to create Recording resource
- **AND** system SHALL store recordingUid for subsequent segment uploads

#### Scenario: Stop recording session
- **WHEN** user clicks stop button or closes extension
- **THEN** system SHALL stop rrweb recorder
- **AND** system SHALL finalize recording session with end time
- **AND** system SHALL emit RECORDING_COMPLETED message
- **AND** system SHALL call PUT /api/v1/workspaces/{code}/recordings/{uid} to update status to completed

#### Scenario: Pause and resume recording
- **WHEN** user pauses recording
- **THEN** system SHALL pause rrweb event collection
- **AND** system SHALL maintain session state
- **WHEN** user resumes recording
- **THEN** system SHALL continue rrweb event collection
- **AND** system SHALL emit recording state update

## ADDED Requirements

### Requirement: Segment generation and upload
The system SHALL automatically generate new segments every 10 minutes and upload them to S3 storage.

#### Scenario: Generate segment on timer
- **WHEN** recording has been active for 10 minutes
- **THEN** system SHALL finalize current segment with end time
- **AND** system SHALL upload segment data to S3 via presigned URL
- **AND** system SHALL call POST /api/v1/workspaces/{code}/recordings/{uid}/segments to create segment record
- **AND** system SHALL start new segment with fresh rrweb events

#### Scenario: Upload segment to S3
- **WHEN** segment is ready for upload
- **THEN** system SHALL call POST /api/v1/workspaces/{code}/recordings/{uid}/segments/presigned to get upload URL
- **AND** system SHALL upload rrweb JSON data to S3 presigned URL
- **AND** system SHALL track uploaded segments for session continuity

#### Scenario: Track pageUrls per segment
- **WHEN** segment ends
- **THEN** system SHALL collect all unique pageUrls visited during segment
- **AND** system SHALL include pageUrls in segment creation request