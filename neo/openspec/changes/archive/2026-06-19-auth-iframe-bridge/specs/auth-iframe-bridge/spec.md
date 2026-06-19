## ADDED Requirements

### Requirement: Iframe Bridge Endpoint

The system SHALL provide a hidden iframe endpoint at `/auth-bridge/user-info` that returns user authentication information via postMessage.

#### Scenario: Endpoint returns user info when authenticated
- **WHEN** the iframe page mounts and the user is logged in with an active workspace
- **THEN** the iframe SHALL send a postMessage with `status: 'ok'` containing `token`, `userId`, `username`, `workspaceCode`, `workspaceId`, and `acquiredAt`

#### Scenario: Endpoint returns not_authenticated when user is not logged in
- **WHEN** the iframe page mounts and the user is not logged in
- **THEN** the iframe SHALL send a postMessage with `status: 'not_authenticated'`

#### Scenario: Endpoint returns no_workspace when user has no active workspace
- **WHEN** the iframe page mounts and the user is logged in but has no active workspace
- **THEN** the iframe SHALL send a postMessage with `status: 'no_workspace'`

### Requirement: postMessage Protocol

The system SHALL use a versioned postMessage protocol for secure communication between the iframe and parent window.

#### Scenario: Message format for success response
- **WHEN** sending a successful user info response
- **THEN** the message SHALL contain `type: 'user_info'`, `version: 1`, `status: 'ok'`, and user data fields

#### Scenario: Message format for error response
- **WHEN** sending an error response
- **THEN** the message SHALL contain `type: 'user_info'`, `version: 1`, and an error status (`not_authenticated` or `no_workspace`)

### Requirement: Test Page

The system SHALL provide a test page at `/auth-bridge/test` for manual verification of the iframe bridge functionality.

#### Scenario: Test page displays current auth state
- **WHEN** the user navigates to `/auth-bridge/test`
- **THEN** the page SHALL display the current authentication state (logged in/logged out) and workspace selection status

#### Scenario: Test page demonstrates postMessage communication
- **WHEN** the user loads the test page and has the Chrome extension popup open
- **THEN** the test page SHALL show the postMessage sent from the iframe when embedded

#### Scenario: Test page allows manual message sending
- **WHEN** the user is on the test page and clicks "Send Test Message" button
- **THEN** the page SHALL send a postMessage to verify the communication channel works
