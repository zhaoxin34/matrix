# rrweb-recording Specification

## Purpose
TBD - created by archiving change chrome-extension-phase1. Update Purpose after archive.
## Requirements
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

### Requirement: Event Capture
The system SHALL capture user interaction events including mouse, keyboard, and DOM mutations.

#### Scenario: Capture mouse events
- **WHEN** user performs mouse actions (click, move, hover)
- **THEN** system SHALL record event type, coordinates, and target element
- **AND** system SHALL include timestamp for each event

#### Scenario: Capture keyboard events
- **WHEN** user types in input fields
- **THEN** system SHALL record keyboard event type (keydown, keyup, keypress)
- **AND** system SHALL record key value and target element

#### Scenario: Capture DOM mutations
- **WHEN** page DOM changes (add, remove, modify nodes)
- **THEN** system SHALL record mutation type and affected nodes
- **AND** system SHALL include serialized node data for replay

### Requirement: Recording Configuration
The system SHALL support configurable recording options.

#### Scenario: Enable/disable recording via settings
- **WHEN** user toggles recording setting in options page
- **THEN** system SHALL persist setting to chrome.storage.local
- **AND** system SHALL apply setting to new recording sessions

#### Scenario: Record speed optimization
- **WHEN** recording large page interactions
- **THEN** system SHALL use incremental event capture
- **AND** system SHALL batch events every 500ms

### Requirement: Recording State Broadcast
The system SHALL broadcast recording state changes to other extension components.

#### Scenario: Broadcast state to iframe
- **WHEN** recording state changes (start/stop/pause/resume)
- **THEN** system SHALL send STATE_UPDATE message to iframe via postMessage
- **AND** message SHALL include isRecording, isPaused, sessionId properties

### Requirement: Shadow DOM Recording Indicator
The system SHALL display a recording indicator using Shadow DOM for style isolation.

#### Scenario: Show recording indicator
- **WHEN** recording starts
- **THEN** system SHALL create Shadow DOM overlay element
- **AND** system SHALL display "Recording" badge in top-right corner

#### Scenario: Update indicator on pause
- **WHEN** recording pauses
- **THEN** indicator SHALL change to "Paused" state
- **AND** indicator badge color SHALL change to amber (#f59e0b)

#### Scenario: Remove indicator on stop
- **WHEN** recording stops
- **THEN** system SHALL remove overlay element
- **AND** system SHALL clean up Shadow DOM container

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

### Requirement: User-triggered Upload to Backend
The system SHALL provide a user-triggered upload flow that transfers locally-stored rrweb segments from the agent-steer extension's IndexedDB to the Neo backend.

#### Scenario: User clicks Upload in Popup
- **WHEN** user is in Paused or Pending state and clicks the Upload button
- **THEN** Popup SHALL switch to UploadInput view
- **AND** user SHALL enter a recording name and confirm
- **AND** Popup SHALL call `startUpload(name, workspaceCode, backendUrl)` on Service Worker

#### Scenario: Service Worker routes upload command to Content Script
- **WHEN** Popup calls `startUpload(name, workspaceCode, backendUrl)`
- **THEN** Service Worker SHALL read auth token from `chrome.storage.local["auth.userInfo"]`
- **AND** Service Worker SHALL detect current active tab via `browser.tabs.query`
- **AND** Service Worker SHALL send `recording-cmd` message with `command: "upload"` and payload `{name, token, workspaceCode, backendUrl}` to the current tab's Content Script

#### Scenario: Content Script uploads segments to backend
- **WHEN** Content Script receives the upload command
- **THEN** Content Script SHALL read unsynced segments via `db.getUnsyncedSegments()` from the page-origin IndexedDB (shared with MAIN world recorder)
- **AND** Content Script SHALL call `POST /api/v1/workspaces/{workspaceCode}/recordings` with `{name, source: "agent"}` and Bearer token to create the Recording
- **AND** for each segment: Content Script SHALL call `PUT /api/v1/workspaces/{workspaceCode}/recordings/{recordingUid}/segments/{segmentUid}/bytes` with the segment's events JSON string
- **AND** for each segment: Content Script SHALL call `POST /api/v1/workspaces/{workspaceCode}/recordings/{recordingUid}/segments` with `{start_time, end_time, page_urls, storage_key, size}` metadata
- **AND** Content Script SHALL call `POST /api/v1/workspaces/{workspaceCode}/recordings/{recordingUid}/complete` to mark the recording as completed

#### Scenario: Content Script pushes upload progress
- **WHEN** upload is in progress
- **THEN** Content Script SHALL send `cs→popup` message with `type: "upload-progress"` and payload `{taskId, status: "uploading", progress: 0-100, currentSegment, totalSegments}` after each segment upload
- **WHEN** all segments are uploaded
- **THEN** Content Script SHALL send `upload-progress` with `{status: "completed", progress: 100, recordingUid}`
- **WHEN** any step fails
- **THEN** Content Script SHALL send `upload-progress` with `{status: "failed", error}`

#### Scenario: Popup listens to upload-progress and switches views
- **WHEN** Popup receives `upload-progress` with `status: "uploading"`
- **THEN** Popup SHALL switch to Uploading view and display the progress percentage
- **WHEN** Popup receives `upload-progress` with `status: "completed"`
- **THEN** Popup SHALL switch to Success view and display the recordingUid
- **WHEN** Popup receives `upload-progress` with `status: "failed"`
- **THEN** Popup SHALL switch to Error view and display the error message

#### Scenario: SuccessView navigates to playback
- **WHEN** user clicks the "View Playback" button in Success view
- **THEN** Popup SHALL open `${neoUrl}/workspace/${workspaceCode}/recordings/${recordingUid}/play` in a new tab via `browser.tabs.create`

#### Scenario: Mark segments as synced after successful upload
- **WHEN** all segments are uploaded successfully
- **THEN** Content Script SHALL call `db.markSegmentSynced(segmentUid)` for each uploaded segment
- **AND** segments SHALL remain in local IndexedDB (manual clear only, not auto-deleted)

#### Scenario: Cross-tab multi-origin upload
- **WHEN** user has recording sessions in multiple browser tabs across different origins
- **THEN** each tab SHALL have an independent upload flow
- **AND** Content Script in tab A SHALL only read IndexedDB for tab A's origin
- **AND** user SHALL trigger upload separately in each tab to upload that tab's segments
- **AND** each tab's upload SHALL create an independent Recording in the backend (one recording per tab, not one combined)

#### Scenario: Upload fails when token expired
- **WHEN** Content Script's fetch call returns 401 Unauthorized
- **THEN** Content Script SHALL send `upload-progress` with `{status: "failed", error: "token expired"}`
- **AND** Popup SHALL switch to Error view and prompt user to re-login

#### Scenario: Upload fails when tab closes mid-upload
- **WHEN** user closes the tab while upload is in progress
- **THEN** Content Script SHALL stop executing (tab destroyed)
- **AND** segments SHALL remain in IndexedDB with `synced: false`
- **WHEN** user reopens the extension
- **THEN** Content Script on the same-origin tab SHALL detect unsynced segments and push `status: "pending"`
- **AND** Popup SHALL display Pending view
- **AND** user SHALL be able to retry the upload

#### Scenario: PendingView auto-recovery on browser restart
- **WHEN** Content Script initializes in a tab
- **THEN** Content Script SHALL query `db.getUnsyncedSegments()` from page-origin IndexedDB
- **AND** if segments exist, Content Script SHALL push `cs→popup state-update` with `status: "pending"` and `segmentCount`
- **AND** Popup SHALL display PendingView allowing user to upload or clear
