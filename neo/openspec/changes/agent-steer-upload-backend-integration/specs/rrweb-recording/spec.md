# rrweb-recording Specification (delta for upload integration)

## Purpose

This delta extends the rrweb-recording capability with the user-triggered upload flow that transfers locally-stored rrweb segments to the Neo backend. The original rrweb-recording spec (recording session management, event capture, segment generation) remains intact.

## ADDED Requirements

### Requirement: Upload recording to backend
The system SHALL provide a user-triggered upload flow that transfers locally-stored rrweb segments to the Neo backend.

#### Scenario: User clicks Upload in Popup
- **WHEN** user is in Paused or Pending state and clicks the Upload button
- **THEN** Popup SHALL switch to UploadInput view
- **AND** user SHALL enter a recording name and confirm
- **AND** Popup SHALL call `startUpload(name, workspaceCode, backendUrl)` on Service Worker

#### Scenario: Service Worker routes upload command to Content Script
- **WHEN** Popup calls `startUpload(name, workspaceCode, backendUrl)`
- **THEN** Service Worker SHALL read auth token from `chrome.storage.local["local:auth.userInfo"]`
- **AND** Service Worker SHALL get the current active tab via `browser.tabs.query`
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
- **THEN** Popup SHALL detect unsynced segments and display Pending view
- **AND** user SHALL be able to retry the upload (in the same tab if possible, or in a tab with the same origin)