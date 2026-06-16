# message-communication Specification (delta for upload)

## Purpose

This delta extends the message-communication capability with the upload command routing (Popup → SW → CS) and upload progress push (CS → Popup). Existing message types (state-update, recording-response) remain intact.

## ADDED Requirements

### Requirement: Upload command from Popup to Content Script
The system SHALL support an upload command routed through Service Worker to Content Script, carrying authentication and routing context required for the Content Script to perform the upload.

#### Scenario: Popup initiates upload via Service Worker
- **WHEN** Popup calls `startUpload(name, workspaceCode, backendUrl?)`
- **THEN** Service Worker SHALL construct a `recording-cmd` message with:
  - `direction: "popup→sw→cs"`
  - `type: "recording-cmd"`
  - `command: "upload"`
  - `payload: { name, token, workspaceCode, backendUrl }`
- **AND** Service Worker SHALL send this message to the current active tab via `browser.tabs.sendMessage`

#### Scenario: Upload command payload
- **WHEN** Service Worker constructs the upload command
- **THEN** `payload.token` SHALL be read from `chrome.storage.local["local:auth.userInfo"].token`
- **AND** `payload.workspaceCode` SHALL match the auth user's selected workspace
- **AND** `payload.backendUrl` SHALL default to `http://localhost:8000` if not provided
- **AND** `payload.name` SHALL be the user-entered recording name

#### Scenario: Content Script receives upload command
- **WHEN** Content Script receives a `recording-cmd` message with `command: "upload"`
- **THEN** Content Script SHALL call `handleUpload(params)` with the payload
- **AND** `handleUpload` SHALL NOT block the message handler (return early, run async)

### Requirement: Upload progress from Content Script to Popup
The system SHALL provide a progress channel from Content Script to Popup for displaying real-time upload status.

#### Scenario: Content Script pushes upload progress
- **WHEN** upload is in progress
- **THEN** Content Script SHALL send `chrome.runtime.sendMessage` with:
  - `direction: "cs→popup"`
  - `type: "upload-progress"`
  - `payload: { taskId, status, progress, currentSegment?, totalSegments?, recordingUid?, error? }`
- **AND** `status` SHALL be one of: `"uploading" | "completed" | "failed" | "cancelled"`

#### Scenario: Service Worker forwards upload-progress
- **WHEN** Service Worker receives `cs→popup upload-progress` via `browser.runtime.onMessage`
- **THEN** Service Worker SHALL log the message and NOT intercept it (allow Popup to receive)
- **AND** Popup SHALL receive via `chrome.runtime.onMessage` and update `useUploadState` accordingly

#### Scenario: Popup useUploadState listens to upload-progress
- **WHEN** `useUploadState` hook is initialized
- **THEN** hook SHALL add a `chrome.runtime.onMessage` listener filtering for `direction: "cs→popup"` and `type: "upload-progress"`
- **AND** on each progress message, hook SHALL update `uploadProgress` state
- **AND** hook SHALL remove the listener on unmount

### Requirement: Upload command error feedback
The system SHALL provide feedback when the upload command cannot reach Content Script (e.g., tab closed, CS not initialized).

#### Scenario: Service Worker cannot send to tab
- **WHEN** `browser.tabs.sendMessage(tabId, uploadCmd)` throws (e.g., tab closed, no CS listener)
- **THEN** Service Worker SHALL return `{success: false, error: "No content script available in current tab"}` to Popup
- **AND** Popup SHALL display this error to the user

#### Scenario: User in non-http tab (e.g., chrome://)
- **WHEN** user is in a chrome:// or extension:// page
- **AND** user opens Popup and tries to upload
- **THEN** Service Worker SHALL detect no CS in current tab
- **AND** Service Worker SHALL return error: "请在已加载扩展的目标软件页面中上传"