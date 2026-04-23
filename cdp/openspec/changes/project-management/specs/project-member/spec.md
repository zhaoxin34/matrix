## ADDED Requirements

### Requirement: Project member can be added
系统 SHALL 支持项目管理员添加成员到项目。

#### Scenario: Add member to project
- **WHEN** 项目管理员通过用户 ID 添加成员
- **THEN** 系统创建 project_member 记录，默认角色为 member

#### Scenario: Add duplicate member
- **WHEN** 添加已存在的成员到项目
- **THEN** 系统返回错误码 1001，提示成员已存在

#### Scenario: Add non-existent user
- **WHEN** 添加不存在的用户到项目
- **THEN** 系统返回错误码 2001（User Not Found）

### Requirement: Project member can be removed
系统 SHALL 支持项目管理员从项目移除成员。

#### Scenario: Remove member from project
- **WHEN** 项目管理员移除成员
- **THEN** 系统删除对应的 project_member 记录

#### Scenario: Remove self from project
- **WHEN** 项目管理员尝试移除自己
- **THEN** 系统 SHALL 允许此操作，但项目至少保留一名管理员

#### Scenario: Non-admin cannot remove members
- **WHEN** 非管理员用户尝试移除成员
- **THEN** 系统返回错误码 1002（Unauthorized）

### Requirement: Project member role can be updated
系统 SHALL 支持项目管理员更新成员角色。

#### Scenario: Promote member to admin
- **WHEN** 项目管理员将成员角色从 member 改为 admin
- **THEN** 系统更新 project_member 记录

#### Scenario: Demote admin to member
- **WHEN** 项目管理员将管理员降为 member
- **THEN** 系统更新 project_member 记录

#### Scenario: Last admin cannot be demoted
- **WHEN** 尝试将项目最后一个管理员降为 member
- **THEN** 系统返回错误码 1001，提示至少保留一名管理员

### Requirement: Project members can be listed
系统 SHALL 支持查询项目成员列表。

#### Scenario: List project members
- **WHEN** 用户请求项目成员列表
- **THEN** 系统返回成员信息，包含用户 ID、姓名、角色和加入时间