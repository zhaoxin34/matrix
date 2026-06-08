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

