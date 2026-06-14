# chrome-upload-service Specification

## Purpose
Service Worker-based upload service that reads segments from IndexedDB and uploads to Neo Backend API.

## ADDED Requirements

### Requirement: Upload Initialization
The system SHALL initialize upload process when user triggers upload command.

#### Scenario: User clicks upload button
- **WHEN** user clicks "Upload" in popup and enters recording name
- **THEN** popup writes `{ name: "录像名称", workspaceCode: "work1" }` to `chrome.storage.local.upload.cmd`
- **AND** Service Worker detects the command
- **AND** Service Worker updates progress to `{ status: "uploading", progress: 0 }`

### Requirement: Create Recording on Backend
The system SHALL create a recording entity on Neo Backend before uploading segments.

#### Scenario: Create recording via API
- **WHEN** upload command is received
- **THEN** Service Worker calls `POST /api/v1/workspaces/{workspaceCode}/recordings`
- **AND** request body includes `enterUrl` and `source: "agent"`
- **AND** response provides `uid` for the recording
- **AND** Service Worker stores `recordingUid` for subsequent segment uploads

### Requirement: Upload Segments to Backend
The system SHALL upload each segment to Neo Backend sequentially.

#### Scenario: Upload single segment
- **WHEN** recording is created and segment is ready
- **THEN** Service Worker reads segment from IndexedDB
- **AND** Service Worker calls `PUT /api/v1/workspaces/{code}/recordings/{uid}/segments/{seg_uid}/bytes`
- **AND** request body contains serialized rrweb JSON events
- **AND** segment `synced` flag is updated to `true` in IndexedDB

#### Scenario: Upload multiple segments sequentially
- **WHEN** recording has multiple segments
- **THEN** Service Worker uploads segments in sequence order
- **AND** progress updates after each segment upload
- **AND** total progress = (uploaded segments / total segments) * 100

#### Scenario: Update progress during upload
- **WHEN** a segment upload completes
- **THEN** Service Worker updates `chrome.storage.local.upload.progress`
- **AND** progress object includes `progress: number` (0-100)
- **AND** popup observes change and updates progress bar

### Requirement: Complete Recording
The system SHALL mark recording as completed after all segments are uploaded.

#### Scenario: Finalize recording
- **WHEN** all segments are uploaded
- **THEN** Service Worker calls `POST /api/v1/workspaces/{code}/recordings/{uid}/complete`
- **AND** request includes `exitUrl` of the last page visited
- **AND** Service Worker updates progress to `{ status: "completed", progress: 100 }`
- **AND** popup shows success state with "View Playback" button

### Requirement: Handle Upload Errors
The system SHALL handle upload failures gracefully with retry logic.

#### Scenario: Retry on network error
- **WHEN** segment upload fails with network error
- **THEN** Service Worker waits 2 seconds
- **AND** Service Worker retries the upload (up to 3 attempts)
- **AND** if all retries fail, status changes to `{ status: "failed", error: "网络错误" }`

#### Scenario: Handle API error
- **WHEN** segment upload fails with API error (4xx/5xx)
- **THEN** Service Worker updates progress to `{ status: "failed", error: "错误信息" }`
- **AND** popup shows error state with retry button

### Requirement: Cancel Upload
The system SHALL allow user to cancel ongoing upload.

#### Scenario: User cancels upload
- **WHEN** user clicks "Cancel" during upload
- **THEN** popup writes `{ action: "cancel" }` to `chrome.storage.local.upload.cmd`
- **AND** Service Worker aborts current upload
- **AND** Service Worker updates progress to `{ status: "cancelled" }`
- **AND** already uploaded segments remain synced in IndexedDB

### Requirement: View Playback Navigation
The system SHALL provide a link to view recording playback in Neo Frontend.

#### Scenario: Navigate to playback
- **WHEN** upload completes successfully
- **THEN** popup displays "View Playback" button
- **AND** button opens `http://localhost:3000/recordings/{uid}` in new tab
- **OR** button opens `/workspaces/{code}/recordings` list page

### Requirement: Upload Progress Tracking
The system SHALL track and display upload progress accurately.

#### Scenario: Track upload progress
- **WHEN** upload is in progress
- **THEN** Service Worker updates progress every segment
- **AND** progress includes: `progress` (0-100), `currentSegment`, `totalSegments`

#### Scenario: Display progress in popup
- **WHEN** progress changes in storage
- **THEN** popup's `UploadPanel` component observes the change
- **AND** progress bar reflects current percentage
- **AND** text shows "Uploading segment 2 of 5..."

### Requirement: Discard Pending Segments
The system SHALL allow user to discard unsynced segments.

#### Scenario: User discards recording
- **WHEN** user clicks "Discard" in pending state
- **THEN** Service Worker deletes all segments for the session from IndexedDB
- **AND** session record is deleted
- **AND** popup returns to Idle state
