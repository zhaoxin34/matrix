# Employee Status Transition

## ADDED Requirements

### Requirement: Status Transition Operations

The system SHALL allow administrators to perform status transitions for employees through the employee list interface.

#### Scenario: Complete Onboarding
- **WHEN** an employee has status `onboarding`
- **THEN** the system SHALL display "完成入职" operation in the dropdown menu
- **AND** clicking "完成入职" SHALL change the employee status to `on_job`
- **AND** the system SHALL display a success toast message
- **AND** the employee list SHALL be automatically refreshed

#### Scenario: Initiate Transfer
- **WHEN** an employee has status `on_job`
- **THEN** the system SHALL display "发起调动" operation in the dropdown menu
- **AND** clicking "发起调动" SHALL change the employee status to `transferring`
- **AND** the system SHALL display a success toast message

#### Scenario: Initiate Offboarding
- **WHEN** an employee has status `on_job`
- **THEN** the system SHALL display "发起离职" operation in the dropdown menu
- **AND** clicking "发起离职" SHALL change the employee status to `offboarding`
- **AND** the system SHALL display a success toast message

#### Scenario: Complete Transfer
- **WHEN** an employee has status `transferring`
- **THEN** the system SHALL display "完成调动" operation in the dropdown menu
- **AND** clicking "完成调动" SHALL change the employee status to `on_job`
- **AND** the system SHALL display a success toast message

#### Scenario: Cancel Transfer
- **WHEN** an employee has status `transferring`
- **THEN** the system SHALL display "取消调动" operation in the dropdown menu
- **AND** clicking "取消调动" SHALL change the employee status to `on_job`
- **AND** the system SHALL display a success toast message

#### Scenario: Rejoin Employee
- **WHEN** an employee has status `offboarding`
- **THEN** the system SHALL display "重新入职" operation in the dropdown menu
- **AND** clicking "重新入职" SHALL change the employee status to `onboarding`
- **AND** the system SHALL display a success toast message

### Requirement: Transition Menu Visibility

The system SHALL only display operations valid for the current employee status.

#### Scenario: No Operations for Invalid Status
- **WHEN** an employee status is not in the transition matrix
- **THEN** the dropdown menu SHALL only contain edit and delete operations
- **AND** no status transition operations SHALL be displayed

### Requirement: Real-time Feedback

The system SHALL provide immediate feedback upon successful status transition.

#### Scenario: Success Toast Display
- **WHEN** a status transition operation completes successfully
- **THEN** the system SHALL display a toast notification
- **AND** the toast SHALL include the employee name and new status label

### Requirement: List Refresh

The system SHALL automatically refresh the employee list after a successful status transition.

#### Scenario: Automatic List Update
- **WHEN** a status transition operation completes successfully
- **THEN** the employee list SHALL be updated to reflect the new status
- **AND** the displayed status badge SHALL show the new status