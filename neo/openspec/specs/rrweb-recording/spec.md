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

#### Scenario: Stop recording session
- **WHEN** user clicks stop button or closes extension
- **THEN** system SHALL stop rrweb recorder
- **AND** system SHALL finalize recording session with end time
- **AND** system SHALL emit RECORDING_COMPLETED message

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

