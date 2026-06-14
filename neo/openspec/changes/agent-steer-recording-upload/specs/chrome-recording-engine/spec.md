# chrome-recording-engine Specification

## Purpose
Chrome Extension recording engine using rrweb for DOM event capture.

## ADDED Requirements

### Requirement: Start Recording
The system SHALL start rrweb recording when user clicks "Start Recording" in popup.

#### Scenario: Start recording from popup
- **WHEN** user clicks "Start Recording" in popup
- **THEN** system writes `{ action: "start" }` to `chrome.storage.local.recording.cmd`
- **AND** Content Script polls and detects the command
- **AND** Content Script injects rrweb-bridge.js into page main world
- **AND** rrweb-bridge.js calls `rrweb.record({ emit: handleEvent })`
- **AND** system sets recording state to `{ isRecording: true, isPaused: false }`

#### Scenario: Start recording creates new session
- **WHEN** recording starts
- **THEN** system generates a new session ID (UUID)
- **AND** system creates first segment with startTime = current timestamp

### Requirement: Pause and Resume Recording
The system SHALL pause and resume recording on user command.

#### Scenario: Pause recording
- **WHEN** user clicks "Pause" in popup
- **THEN** system writes `{ action: "pause" }` to `chrome.storage.local.recording.cmd`
- **AND** rrweb-bridge.js sets internal paused flag
- **AND** system updates state to `{ isPaused: true }`
- **AND** current segment remains open (no flush)

#### Scenario: Resume recording
- **WHEN** user clicks "Resume" in popup
- **THEN** system writes `{ action: "resume" }` to `chrome.storage.local.recording.cmd`
- **AND** rrweb-bridge.js clears paused flag
- **AND** system updates state to `{ isPaused: false }`

### Requirement: Stop Recording
The system SHALL stop recording and finalize all segments.

#### Scenario: Stop recording
- **WHEN** user clicks "Stop" in popup
- **THEN** system writes `{ action: "stop" }` to `chrome.storage.local.recording.cmd`
- **AND** rrweb-bridge.js finalizes current segment (writes to IndexedDB)
- **AND** rrweb-bridge.js calls `rrweb.record().stop()`
- **AND** system updates state to `{ isRecording: false, isPaused: false }`

### Requirement: Auto Segment Flush
The system SHALL automatically flush segments every 10 minutes during active recording.

#### Scenario: Timer-based segment flush
- **WHEN** recording has been active for 10 minutes
- **THEN** rrweb-bridge.js finalizes current segment with endTime
- **AND** segment data is written to IndexedDB with `synced: false`
- **AND** a new segment begins automatically
- **AND** segment count increments in recording state

#### Scenario: Segment flush on tab change
- **WHEN** user switches to a different tab
- **THEN** current segment is finalized and saved to IndexedDB
- **AND** new tab gets a fresh segment (if recording continues)

### Requirement: rrweb Event Capture
The system SHALL capture DOM events via rrweb.

#### Scenario: Capture mouse events
- **WHEN** user moves or clicks mouse on page
- **THEN** rrweb captures event type, coordinates, and target
- **AND** event is added to current segment's event buffer

#### Scenario: Capture keyboard events
- **WHEN** user types on page
- **THEN** rrweb captures keydown/keyup events
- **AND** event is added to current segment's event buffer

#### Scenario: Capture DOM mutations
- **WHEN** page DOM changes
- **THEN** rrweb captures mutation type and affected nodes
- **AND** event is added to current segment's event buffer

### Requirement: Recording State Sync
The system SHALL sync recording state to popup via chrome.storage.

#### Scenario: Broadcast state on change
- **WHEN** recording state changes (start/pause/resume/stop)
- **THEN** Content Script writes new state to `chrome.storage.local.recording.state`
- **AND** popup observes change and updates UI

#### Scenario: Periodic duration update
- **WHEN** recording is active
- **THEN** Content Script updates duration in state every second
- **AND** popup displays current duration

### Requirement: Browser Restart Detection
The system SHALL detect unsynced segments on extension/popup load.

#### Scenario: Detect pending segments on startup
- **WHEN** popup opens
- **THEN** system queries IndexedDB for segments with `synced: false`
- **AND** if segments exist, popup shows "Pending" state with upload option
