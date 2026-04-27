## ADDED Requirements

### Requirement: List skills with pagination
系统 SHALL 支持分页查询技能列表。

#### Scenario: List skills with default pagination
- **WHEN** 用户发送 GET `/api/v1/skills` 请求，无分页参数
- **THEN** 系统返回第一页，每页 20 条记录
- **AND** 响应包含 total, page, page_size, items

#### Scenario: List skills with custom pagination
- **WHEN** 用户发送 GET `/api/v1/skills?page=2&page_size=10` 请求
- **THEN** 系统返回第 2 页，每页 10 条记录

#### Scenario: List skills with page out of range
- **WHEN** 用户发送 GET `/api/v1/skills?page=9999` 请求，页码超出范围
- **THEN** 系统返回空列表，total 保持正确

### Requirement: Filter skills by level
系统 SHALL 支持按 level 筛选技能。

#### Scenario: Filter by level
- **WHEN** 用户发送 GET `/api/v1/skills?level=Planning` 请求
- **THEN** 系统只返回 level = 'Planning' 的技能

#### Scenario: Filter by invalid level
- **WHEN** 用户发送 GET `/api/v1/skills?level=Invalid` 请求
- **THEN** 系统返回 422 Unprocessable Entity，错误信息说明 level 无效

### Requirement: Filter skills by tags
系统 SHALL 支持按标签筛选技能。

#### Scenario: Filter by single tag
- **WHEN** 用户发送 GET `/api/v1/skills?tags=workflow` 请求
- **THEN** 系统只返回包含 tag 'workflow' 的技能

#### Scenario: Filter by multiple tags
- **WHEN** 用户发送 GET `/api/v1/skills?tags=workflow,pm` 请求
- **THEN** 系统返回包含 tag 'workflow' 或 'pm' 的技能

### Requirement: Filter skills by is_active
系统 SHALL 支持按启用状态筛选技能。

#### Scenario: Filter active skills only
- **WHEN** 用户发送 GET `/api/v1/skills?is_active=true` 请求
- **THEN** 系统只返回 is_active = true 的技能

#### Scenario: Filter inactive skills only
- **WHEN** 用户发送 GET `/api/v1/skills?is_active=false` 请求
- **THEN** 系统只返回 is_active = false 的技能

### Requirement: Combined filters
系统 SHALL 支持多个筛选条件组合。

#### Scenario: Combine level and is_active filters
- **WHEN** 用户发送 GET `/api/v1/skills?level=Planning&is_active=true` 请求
- **THEN** 系统返回同时满足 level='Planning' 和 is_active=true 的技能

### Requirement: Default list behavior
系统 SHALL 默认只返回未删除且已启用的技能。

#### Scenario: List excludes deleted skills by default
- **WHEN** 用户发送 GET `/api/v1/skills` 请求
- **THEN** 系统不返回 deleted_at 不为 NULL 的技能

#### Scenario: List excludes inactive skills by default
- **WHEN** 用户发送 GET `/api/v1/skills` 请求
- **THEN** 系统不返回 is_active = false 的技能
