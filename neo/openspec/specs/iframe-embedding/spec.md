# iframe-embedding Specification

## Purpose
TBD - created by archiving change chrome-extension-phase1. Update Purpose after archive.
## Requirements
### Requirement: Iframe Dynamic Creation
The system SHALL create iframe dynamically when user activates an agent mode.

#### Scenario: Create iframe on mode activation
- **WHEN** user selects a mode (learn/guide/active) from popup
- **THEN** system SHALL create an iframe element programmatically
- **AND** system SHALL set iframe source to Neo frontend URL with mode parameter

#### Scenario: Iframe positioning
- **WHEN** iframe is created
- **THEN** iframe SHALL be positioned at bottom-right corner (16px from edges)
- **AND** iframe SHALL have dimensions 400px width x 600px height
- **AND** iframe SHALL have rounded corners (8px border-radius)

#### Scenario: Single iframe instance
- **WHEN** iframe already exists and user activates mode again
- **THEN** system SHALL reuse existing iframe
- **AND** system SHALL navigate iframe to new mode URL

### Requirement: Iframe Communication
The system SHALL establish bidirectional communication with iframe content.

#### Scenario: Send initialization to iframe
- **WHEN** iframe finishes loading
- **THEN** content script SHALL send IFRAME_READY message with config
- **AND** iframe SHALL acknowledge ready state

#### Scenario: Receive messages from iframe
- **WHEN** iframe sends message via postMessage
- **THEN** content script SHALL receive and parse message
- **AND** system SHALL forward message to background service worker

#### Scenario: Send messages to iframe
- **WHEN** content script needs to communicate with iframe
- **THEN** system SHALL use iframe.contentWindow.postMessage
- **AND** system SHALL use "*" as target origin for iframe communication

### Requirement: Mode Switching
The system SHALL support switching between agent modes.

#### Scenario: Learn mode activation
- **WHEN** user selects "Learn Mode"
- **THEN** iframe SHALL navigate to `#/agent/mode?mode=learn`
- **AND** recording SHALL start automatically
- **AND** system SHALL update AgentMode state to LEARN

#### Scenario: Guide mode activation
- **WHEN** user selects "Guide Mode"
- **THEN** iframe SHALL navigate to `#/agent/mode?mode=guide`
- **AND** system SHALL update AgentMode state to GUIDE

#### Scenario: Active mode activation
- **WHEN** user selects "Active Mode"
- **THEN** iframe SHALL navigate to `#/agent/mode?mode=active`
- **AND** system SHALL update AgentMode state to ACTIVE

### Requirement: Iframe Removal
The system SHALL properly clean up iframe when user closes agent.

#### Scenario: Close iframe
- **WHEN** user clicks close button or presses ESC
- **THEN** system SHALL remove iframe element from DOM
- **AND** system SHALL stop any active recording
- **AND** system SHALL reset agent state to idle

### Requirement: URL Parameter Handling
The system SHALL pass configuration via URL parameters.

#### Scenario: Pass mode parameter
- **WHEN** iframe is created
- **THEN** system SHALL append `mode` query parameter
- **AND** system SHALL append `token` query parameter (if authenticated)

#### Scenario: Handle mode changes
- **WHEN** user switches mode within iframe
- **THEN** iframe SHALL update URL hash
- **AND** content script SHALL detect URL changes via message

