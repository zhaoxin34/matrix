---
id: skill-permission
title: Skill 权限控制规格
change: skills-management
---

## ADDED Requirements

### Requirement: Role-Based Access Control
The system SHALL enforce role-based permissions for Skill operations.

#### Scenario: super_admin can perform all operations
- **WHEN** a user with super_admin role attempts any Skill operation
- **THEN** the system allows the operation

#### Scenario: skill_admin can perform all operations
- **WHEN** a user with skill_admin role attempts any Skill operation
- **THEN** the system allows the operation

#### Scenario: skill_viewer can only read
- **WHEN** a user with skill_viewer role attempts to create, update, or delete a Skill
- **THEN** the system returns HTTP 403 Forbidden

#### Scenario: skill_viewer can read
- **WHEN** a user with skill_viewer role attempts to get Skill details or list
- **THEN** the system allows the operation

### Requirement: Owner-Based Edit Permission
The system SHALL restrict skill_editor to editing only their own Skills.

#### Scenario: skill_editor can edit own skill
- **WHEN** a user with skill_editor role attempts to edit a Skill where create_user_id matches their user_id
- **THEN** the system allows the operation

#### Scenario: skill_editor cannot edit others' skills
- **WHEN** a user with skill_editor role attempts to edit a Skill where create_user_id does not match their user_id
- **THEN** the system returns HTTP 403 Forbidden

#### Scenario: skill_editor can create new skills
- **WHEN** a user with skill_editor role creates a new Skill
- **THEN** the system allows the operation and sets create_user_id to their user_id

#### Scenario: skill_editor can only publish own skills
- **WHEN** a user with skill_editor role attempts to publish a Skill they did not create
- **THEN** the system returns HTTP 403 Forbidden

### Requirement: Delete Permission
The system SHALL restrict Skill deletion based on role and ownership.

#### Scenario: admin can delete any draft skill
- **WHEN** a user with skill_admin role deletes a draft Skill they did not create
- **THEN** the system allows the operation

#### Scenario: skill_editor can delete own draft skill
- **WHEN** a user with skill_editor role deletes a draft Skill they created
- **THEN** the system allows the operation

#### Scenario: skill_editor cannot delete others' skills
- **WHEN** a user with skill_editor role deletes a Skill they did not create
- **THEN** the system returns HTTP 403 Forbidden

#### Scenario: Cannot delete active skills
- **WHEN** any user attempts to delete an active Skill
- **THEN** the system returns HTTP 400 Bad Request

### Requirement: Default Role Assignment
The system SHALL assign default roles to new users.

#### Scenario: New users get skill_editor role
- **WHEN** a new user is created
- **THEN** the user is assigned skill_editor role

#### Scenario: New users get skill_viewer role
- **WHEN** a new user is created
- **THEN** the user is assigned skill_viewer role

### Requirement: Permission Hierarchy
The system SHALL support permission inheritance based on role hierarchy.

#### Scenario: Admin roles can perform editor operations
- **WHEN** a user with skill_admin role performs an operation
- **THEN** the system applies the most permissive allowed permission

#### Scenario: Viewer role is most restrictive
- **WHEN** a user with only skill_viewer role performs any operation
- **THEN** the system only allows read operations