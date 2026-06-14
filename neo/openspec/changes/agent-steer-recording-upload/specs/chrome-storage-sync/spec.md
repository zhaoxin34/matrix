# chrome-storage-sync Specification

## Purpose
IndexedDB-based storage for recording segments with sync status tracking.

## ADDED Requirements

### Requirement: IndexedDB Database Structure
The system SHALL use IndexedDB for persistent storage of recording segments.

#### Scenario: Database initialization
- **WHEN** extension loads
- **THEN** system creates IndexedDB database named `neo-agent-recordings`
- **AND** system creates object store `segments` with keyPath `uid`
- **AND** system creates index `sessionId` for querying by session
- **AND** system creates index `createdAt` for chronological queries

#### Scenario: Database schema version
- **WHEN** database schema needs to change
- **THEN** system implements version migration in `onupgradeneeded` handler
- **AND** existing data is preserved during migration

### Requirement: Segment Data Structure
The system SHALL store segments with all required metadata.

#### Scenario: Store segment with metadata
- **WHEN** segment is finalized
- **THEN** system stores segment with fields:
  - `uid`: unique identifier (UUID)
  - `sessionId`: recording session identifier
  - `sequence`: segment number within session (starting at 1)
  - `startTime`: Unix timestamp when segment started
  - `endTime`: Unix timestamp when segment ended
  - `eventCount`: number of rrweb events in segment
  - `events`: ArrayBuffer containing serialized rrweb events
  - `pageUrls`: array of URLs visited during segment
  - `createdAt`: timestamp when segment was stored
  - `synced`: boolean indicating upload status

### Requirement: Segment CRUD Operations
The system SHALL provide create, read, update, and delete operations for segments.

#### Scenario: Create new segment
- **WHEN** a new segment is created
- **THEN** system generates UUID for segment
- **THEN** system assigns sequence number (next in session)
- **AND** system stores segment with initial `synced: false`

#### Scenario: Get segment by UID
- **WHEN** system requests segment by UID
- **THEN** system returns full segment object from IndexedDB
- **OR** system returns null if segment not found

#### Scenario: List segments by session
- **WHEN** system queries segments for a session
- **THEN** system returns array sorted by sequence ascending
- **AND** each segment includes all metadata and event count

#### Scenario: Update segment sync status
- **WHEN** segment is successfully uploaded
- **THEN** system updates segment's `synced` field to `true`
- **AND** system records upload timestamp

#### Scenario: Delete segment
- **WHEN** user discards a recording or after successful upload cleanup
- **THEN** system removes segment from IndexedDB
- **AND** system returns success status

### Requirement: Query Unsynced Segments
The system SHALL provide efficient queries for pending uploads.

#### Scenario: Get all unsynced segments
- **WHEN** upload is triggered
- **THEN** system queries all segments where `synced === false`
- **AND** returns array sorted by `createdAt` ascending

#### Scenario: Get unsynced segments by session
- **WHEN** user has pending recording from previous session
- **THEN** system queries segments by `sessionId` where `synced === false`
- **AND** returns segments for upload or discard

### Requirement: Storage Quota Management
The system SHALL handle IndexedDB storage constraints gracefully.

#### Scenario: Check storage usage
- **WHEN** storing a new segment
- **THEN** system estimates storage size
- **AND** if quota would be exceeded, system deletes oldest synced segments first

#### Scenario: Handle quota exceeded
- **WHEN** IndexedDB write fails with quota error
- **THEN** system deletes oldest synced segments
- **AND** system retries the write
- **AND** if still failing, system notifies user to clear old recordings

### Requirement: Session Management
The system SHALL track recording sessions and associate segments.

#### Scenario: Create new session
- **WHEN** user starts a new recording
- **THEN** system generates session ID (UUID)
- **AND** session record is created with startTime and `active: true`

#### Scenario: Track active session
- **WHEN** extension loads with an active session
- **THEN** system detects session with `active: true`
- **AND** system continues recording from last segment

#### Scenario: End session
- **WHEN** user stops recording
- **THEN** system marks session as `active: false`
- **AND** session endTime is recorded
- **AND** all segments are marked for sync

#### Scenario: List sessions
- **WHEN** user requests session history
- **THEN** system returns sessions sorted by `createdAt` descending
- **AND** each session includes segment count and total duration
