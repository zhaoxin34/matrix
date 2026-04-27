## ADDED Requirements

### Requirement: User can list their projects
系统 SHALL 支持用户查看自己所属的所有项目。

#### Scenario: List user's projects
- **WHEN** 用户请求自己的项目列表
- **THEN** 系统返回用户所属的所有项目，包含项目基本信息（name, code）和用户在项目中的角色

#### Scenario: Empty project list
- **WHEN** 用户不属于任何项目
- **THEN** 系统返回空数组

### Requirement: User can check project membership
系统 SHALL 支持用户检查自己在特定项目中的成员信息。

#### Scenario: Get user's role in project
- **WHEN** 用户查询在特定项目中的角色
- **THEN** 系统返回用户的 project_member 记录（如果存在）

#### Scenario: User is not project member
- **WHEN** 用户查询自己不属于的项目
- **THEN** 系统返回错误码 1002（Unauthorized）或 null membership