# task-management spec

## Purpose

This capability provides users with task management features including viewing, filtering, searching, and controlling task lifecycle (cancel, enable/disable).

*(Detailed purpose statement TBD)*

## Requirements

### Requirement: User can view task list
The system SHALL allow users to view a paginated list of tasks within a workspace.

#### Scenario: View task list with pagination
- **WHEN** user navigates to `/workspace/{workspace_code}/tasks`
- **THEN** system displays a paginated list of tasks with columns: ID, Name, Agent, Type, Priority, Last Exec Status, Status, Created At

#### Scenario: Navigate task list pages
- **WHEN** user clicks "Next" or "Previous" button
- **THEN** system displays the corresponding page of tasks

### Requirement: User can filter task list
The system SHALL allow users to filter tasks by last exec status, task type, priority, agent, owner, and time range.

#### Scenario: Filter by last exec status
- **WHEN** user selects a last exec status filter (e.g., "success", "failed")
- **THEN** system displays only tasks with the selected last exec status

#### Scenario: Filter by task type
- **WHEN** user selects a task type filter (e.g., "periodic", "temporary")
- **THEN** system displays only tasks of the selected type

#### Scenario: Filter by multiple criteria
- **WHEN** user applies multiple filters simultaneously
- **THEN** system displays tasks matching all selected criteria

### Requirement: User can search tasks
The system SHALL allow users to search tasks by name or ID.

#### Scenario: Search by task name
- **WHEN** user enters a search term in the search box
- **THEN** system displays tasks whose name contains the search term

#### Scenario: Search by task ID
- **WHEN** user enters a numeric ID in the search box
- **THEN** system displays the task with the matching ID

### Requirement: User can view task details
The system SHALL allow users to view complete task information including all attributes and execution records.

#### Scenario: View task details for periodic task
- **WHEN** user clicks on a periodic task row
- **THEN** system displays task details with an "Edit" button

#### Scenario: View task details for temporary/dispatch task
- **WHEN** user clicks on a temporary or dispatch task row
- **THEN** system displays task details without an "Edit" button

### Requirement: User can cancel task
The system SHALL allow users to cancel tasks that are pending, running, or paused.

#### Scenario: Cancel pending task
- **WHEN** user clicks "Cancel" on a pending task
- **THEN** system updates task last_exec_status to "cancelled"
- **AND** task cannot be executed again

#### Scenario: Cancel running task
- **WHEN** user clicks "Cancel" on a running task
- **THEN** system updates task last_exec_status to "cancelled"
- **AND** task cannot be executed again

#### Scenario: Cannot cancel successful task
- **WHEN** user clicks "Cancel" on a task with last_exec_status "success"
- **THEN** system returns error "Task has already succeeded"

### Requirement: User can disable task
The system SHALL allow users to disable any task, preventing it from being scheduled.

#### Scenario: Disable enabled task
- **WHEN** user clicks "Disable" on an enabled task
- **THEN** system updates task status to "disabled"
- **AND** task will not be scheduled by cron

#### Scenario: Disable already disabled task
- **WHEN** user clicks "Disable" on an already disabled task
- **THEN** system returns error "Task is already disabled"

### Requirement: User can enable task
The system SHALL allow users to enable a disabled task, allowing it to be scheduled again.

#### Scenario: Enable disabled task
- **WHEN** user clicks "Enable" on a disabled task
- **THEN** system updates task status to "enabled"
- **AND** task can be scheduled by cron

#### Scenario: Enable already enabled task
- **WHEN** user clicks "Enable" on an already enabled task
- **THEN** system returns error "Task is already enabled"

### Requirement: Pause/Resume buttons show warning
The system SHALL display pause and resume buttons, but clicking them SHALL show "Feature not supported yet" message.

#### Scenario: Click pause button
- **WHEN** user clicks "Pause" button
- **THEN** system displays a toast message "Feature not supported yet"

#### Scenario: Click resume button
- **WHEN** user clicks "Resume" button
- **THEN** system displays a toast message "Feature not supported yet"