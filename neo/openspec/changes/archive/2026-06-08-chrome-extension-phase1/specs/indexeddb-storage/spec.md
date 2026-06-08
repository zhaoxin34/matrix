## ADDED Requirements

### Requirement: IndexedDB Database Structure
The system SHALL use IndexedDB for persistent storage of recording data.

#### Scenario: Database initialization
- **WHEN** extension first loads
- **THEN** system SHALL create IndexedDB database named "neo-agent-recordings"
- **AND** system SHALL create object store "recordings" with keyPath "id"
- **AND** system SHALL create indexes for sessionId and createdAt

#### Scenario: Database schema version
- **WHEN** database schema needs to change
- **THEN** system SHALL implement version migration
- **AND** system SHALL preserve existing data during migration

### Requirement: Recording Data Persistence
The system SHALL save recording events to IndexedDB.

#### Scenario: Save recording session
- **WHEN** recording stops
- **THEN** system SHALL save recording data to IndexedDB
- **AND** data SHALL include sessionId, events array, startTime, endTime
- **AND** data SHALL include createdAt timestamp

#### Scenario: Save events incrementally
- **WHEN** recording is in progress
- **THEN** system SHALL batch save events every 5 seconds
- **AND** system SHALL update existing record with new events
- **AND** system SHALL handle storage quota errors gracefully

#### Scenario: Mark sync status
- **WHEN** recording is saved locally
- **THEN** system SHALL set synced field to false
- **AND** system SHALL update synced to true after successful upload

### Requirement: Recording Retrieval
The system SHALL provide methods to retrieve recordings from IndexedDB.

#### Scenario: Get recording by ID
- **WHEN** system requests recording by ID
- **THEN** system SHALL return full recording data from IndexedDB
- **OR** system SHALL return null if not found

#### Scenario: List recordings
- **WHEN** system requests all recordings
- **THEN** system SHALL return array sorted by createdAt descending
- **AND** system SHALL support pagination (limit, offset)

#### Scenario: Get unsynced recordings
- **WHEN** system needs to sync recordings
- **THEN** system SHALL query recordings where synced = false
- **AND** system SHALL return array of pending recordings

### Requirement: Recording Deletion
The system SHALL support deleting recordings from IndexedDB.

#### Scenario: Delete recording
- **WHEN** user deletes a recording
- **THEN** system SHALL remove record from IndexedDB
- **AND** system SHALL return success/failure status

#### Scenario: Delete old recordings
- **WHEN** storage exceeds limit
- **THEN** system SHALL delete oldest synced recordings
- **AND** system SHALL maintain at least 50 most recent recordings

### Requirement: Storage Quota Management
The system SHALL manage storage usage to prevent quota exceeded errors.

#### Scenario: Check storage usage
- **WHEN** saving a new recording
- **THEN** system SHALL check estimated storage size
- **AND** system SHALL fail gracefully if quota exceeded

#### Scenario: Auto cleanup
- **WHEN** storage usage exceeds 80% of quota
- **THEN** system SHALL automatically delete oldest synced recordings
- **AND** system SHALL notify user of cleanup action