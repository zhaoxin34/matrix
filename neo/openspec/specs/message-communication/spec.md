# message-communication Specification

## Purpose
TBD - created by archiving change chrome-extension-phase1. Update Purpose after archive.
## Requirements
### Requirement: Message Type Definitions
The system SHALL define standard message types for all extension communications.

#### Scenario: Define message type enum
- **WHEN** implementing message communication
- **THEN** system SHALL use MessageType enum with defined values
- **AND** types SHALL include: START_RECORDING, STOP_RECORDING, STATE_UPDATE, EXECUTE_OPERATION, etc.

### Requirement: Message Factory Function
The system SHALL provide a standardized way to create messages.

#### Scenario: Create message with factory
- **WHEN** component needs to send a message
- **THEN** system SHALL use createMessage(type, payload, correlationId?)
- **AND** system SHALL auto-generate messageId and timestamp
- **AND** system SHALL return AgentMessage interface

### Requirement: Background to Content Script Communication
The system SHALL support messages from background service worker to content script.

#### Scenario: Send message to content script
- **WHEN** background needs to communicate with content script
- **THEN** system SHALL use chrome.tabs.sendMessage
- **AND** system SHALL include tabId for routing
- **AND** system SHALL handle missing tab gracefully

#### Scenario: Receive message in content script
- **WHEN** content script receives chrome.runtime.onMessage
- **THEN** system SHALL parse message type
- **AND** system SHALL execute appropriate handler
- **AND** system SHALL return response via callback

### Requirement: Content Script to Iframe Communication
The system SHALL support messages from content script to iframe via postMessage.

#### Scenario: Send state update to iframe
- **WHEN** recording state changes
- **THEN** content script SHALL postMessage to iframe
- **AND** message SHALL include AgentMessage structure
- **AND** iframe SHALL receive via window.addEventListener('message')

#### Scenario: Receive operation from iframe
- **WHEN** iframe sends operation request
- **THEN** content script SHALL receive via window message listener
- **AND** system SHALL parse and execute operation
- **AND** system SHALL send result back to iframe

### Requirement: Correlation ID for Request-Response
The system SHALL support correlation IDs for matching requests to responses.

#### Scenario: Set correlation ID on request
- **WHEN** iframe sends operation request
- **THEN** message SHALL include correlationId field
- **AND** correlationId SHALL be generated or passed by sender

#### Scenario: Match response to request
- **WHEN** response is sent back
- **THEN** response SHALL include same correlationId
- **AND** sender SHALL use correlationId to match response

### Requirement: Message Queuing
The system SHALL queue messages when recipient is not ready.

#### Scenario: Queue message for offline recipient
- **WHEN** message is sent but recipient is not loaded
- **THEN** system SHALL queue message in memory
- **AND** system SHALL deliver queued messages when recipient becomes ready

#### Scenario: Handle message delivery failure
- **WHEN** chrome.tabs.sendMessage fails
- **THEN** system SHALL log error
- **AND** system SHALL attempt retry up to 3 times
- **AND** system SHALL notify sender of failure

### Requirement: Message Validation
The system SHALL validate incoming messages before processing.

#### Scenario: Validate message structure
- **WHEN** message is received
- **THEN** system SHALL validate required fields (type, payload, timestamp, messageId)
- **AND** system SHALL reject malformed messages
- **AND** system SHALL log validation errors

#### Scenario: Validate message type
- **WHEN** message with unknown type is received
- **THEN** system SHALL log warning
- **AND** system SHALL return error response
- **AND** system SHALL not crash

### Requirement: Upload Command from Popup to Content Script
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
- **THEN** `payload.token` SHALL be read from `chrome.storage.local["auth.userInfo"].token` (WXT prefix stripped)
- **AND** `payload.workspaceCode` SHALL match the auth user's selected workspace
- **AND** `payload.backendUrl` SHALL default to `http://localhost:8000` if not provided
- **AND** `payload.name` SHALL be the user-entered recording name

#### Scenario: Service Worker refuses upload on non-http tab
- **WHEN** current active tab URL is `chrome://` or `extension://` or `about:blank`
- **AND** Popup calls `startUpload(...)`
- **THEN** Service Worker SHALL return `{success: false, error: "请在已加载扩展的目标软件页面中上传"}`

#### Scenario: Service Worker refuses upload when token missing
- **WHEN** `chrome.storage.local["auth.userInfo"]` is empty or has no token
- **AND** Popup calls `startUpload(...)`
- **THEN** Service Worker SHALL return `{success: false, error: "未登录或 token 缺失"}`

#### Scenario: Content Script receives upload command
- **WHEN** Content Script receives a `recording-cmd` message with `command: "upload"`
- **THEN** Content Script SHALL call `handleUpload(params)` with the payload
- **AND** `handleUpload` SHALL NOT block the message handler (return early, run async)

### Requirement: Upload Progress from Content Script to Popup
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

### Requirement: Upload Command Error Feedback
The system SHALL provide feedback when the upload command cannot reach Content Script (e.g., tab closed, CS not initialized).

#### Scenario: Service Worker cannot send to tab
- **WHEN** `browser.tabs.sendMessage(tabId, uploadCmd)` throws (e.g., tab closed, no CS listener)
- **THEN** Service Worker SHALL return `{success: false, error: "No content script available in current tab"}` to Popup
- **AND** Popup SHALL display this error to the user

