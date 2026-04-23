## ADDED Requirements

### Requirement: Organization can be associated with project
系统 SHALL 支持项目管理员将组织关联到项目。

#### Scenario: Associate organization with project
- **WHEN** 项目管理员关联组织到项目
- **THEN** 系统创建 org_project 记录，建立 N:M 关系

#### Scenario: Associate duplicate organization
- **WHEN** 关联已关联的组织到项目
- **THEN** 系统返回错误码 1001，提示关联已存在

#### Scenario: Associate non-existent organization
- **WHEN** 关联不存在的组织
- **THEN** 系统返回错误码 3002（Organization Not Found）

### Requirement: Organization association can be removed
系统 SHALL 支持项目管理员取消组织与项目的关联。

#### Scenario: Remove organization association
- **WHEN** 项目管理员取消组织关联
- **THEN** 系统删除对应的 org_project 记录

#### Scenario: Remove non-existent association
- **WHEN** 取消不存在的关联
- **THEN** 系统返回错误码 3001（Resource Not Found）

### Requirement: Project can query associated organizations
系统 SHALL 支持查询项目关联的所有组织。

#### Scenario: List project organizations
- **WHEN** 用户请求项目关联的组织列表
- **THEN** 系统返回组织信息，包含组织 ID、名称和关联时间

#### Scenario: Organization access control
- **WHEN** 项目关联组织后，项目内的查询 SHALL 过滤该组织下的员工数据
- **THEN** 系统确保项目只能访问已关联组织的员工数据