## ADDED Requirements

### Requirement: Project can be created
系统 SHALL 支持创建新项目，包含名称（name）、唯一标识符（code）和描述（description）。

#### Scenario: Successful project creation
- **WHEN** 用户提交有效的项目信息（name, code, description）
- **THEN** 系统创建项目并返回项目信息，且创建者自动成为项目管理员

#### Scenario: Duplicate project code
- **WHEN** 用户提交一个已存在的 project code
- **THEN** 系统返回错误码 1001（Invalid Parameter），提示 code 已存在

#### Scenario: Project code uniqueness validation
- **WHEN** 系统验证 project code
- **THEN** 系统 SHALL 确保 code 在全局唯一

### Requirement: Project can be queried
系统 SHALL 支持查询项目信息。

#### Scenario: Get project by ID
- **WHEN** 用户请求指定 ID 的项目详情
- **THEN** 系统返回项目信息（id, name, code, description, status, created_at, updated_at）

#### Scenario: Project not found
- **WHEN** 请求的项目 ID 不存在
- **THEN** 系统返回错误码 3001（Resource Not Found）

### Requirement: Project can be updated
系统 SHALL 支持项目管理员更新项目信息。

#### Scenario: Update project name and description
- **WHEN** 项目管理员提交更新请求（name 或 description）
- **THEN** 系统更新项目信息并返回更新后的数据

#### Scenario: Non-admin cannot update project
- **WHEN** 非管理员用户尝试更新项目
- **THEN** 系统返回错误码 1002（Unauthorized）

### Requirement: Project can be deleted
系统 SHALL 支持项目管理员删除项目。

#### Scenario: Delete project with cascade
- **WHEN** 项目管理员删除项目
- **THEN** 系统 SHALL 级联删除该项目下的所有成员关系（project_member 记录）

#### Scenario: Delete non-existent project
- **WHEN** 删除不存在的项目
- **THEN** 系统返回错误码 3001（Resource Not Found）

### Requirement: Project listing with pagination
系统 SHALL 支持分页查询项目列表。

#### Scenario: List projects with pagination
- **WHEN** 用户请求项目列表
- **THEN** 系统返回分页结果，包含 total, page, page_size 和项目数组

#### Scenario: Filter projects by status
- **WHEN** 用户按状态过滤项目
- **THEN** 系统只返回符合条件的数据