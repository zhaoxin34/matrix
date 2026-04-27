## MODIFIED Requirements

### Requirement: Create skill
系统 SHALL 允许管理员创建新技能。新建技能时 status 默认设置为 'draft'。

#### Scenario: Create skill successfully
- **WHEN** 管理员发送 POST `/api/v1/skills` 请求，包含有效的 code, name, level, content
- **THEN** 系统返回 201 Created，包含创建成功的技能对象
- **AND** 技能的 status 字段值为 'draft'

#### Scenario: Create skill with duplicate code
- **WHEN** 管理员发送 POST `/api/v1/skills` 请求，使用已存在的 code
- **THEN** 系统返回 409 Conflict，错误信息包含 "code already exists"

#### Scenario: Create skill with invalid code format
- **WHEN** 管理员发送 POST `/api/v1/skills` 请求，code 不符合 `[a-zA-Z0-9-]{4,64}` 规范
- **THEN** 系统返回 422 Unprocessable Entity，错误信息包含 code 格式错误

#### Scenario: Create skill with invalid level
- **WHEN** 管理员发送 POST `/api/v1/skills` 请求，level 不在 [Planning, Functional, Atomic] 中
- **THEN** 系统返回 422 Unprocessable Entity，错误信息包含 level 无效

#### Scenario: Create skill without required fields
- **WHEN** 管理员发送 POST `/api/v1/skills` 请求，缺少必填字段 (code, name, level)
- **THEN** 系统返回 422 Unprocessable Entity，列出缺失的必填字段

#### Scenario: Create skill with content
- **WHEN** 管理员发送 POST `/api/v1/skills` 请求，包含 content 字段
- **THEN** 系统创建技能并设置 content
- **AND** status 仍为 'draft'（content 不改变创建时的 draft 状态）

### Requirement: Get skill by code
系统 SHALL 允许用户通过 code 获取技能详情。

#### Scenario: Get existing skill
- **WHEN** 用户发送 GET `/api/v1/skills/{code}` 请求，code 对应已存在且未删除的技能
- **THEN** 系统返回 200 OK，包含技能的完整信息 (code, name, level, tags, author, content, status)

#### Scenario: Get non-existent skill
- **WHEN** 用户发送 GET `/api/v1/skills/{code}` 请求，code 不存在
- **THEN** 系统返回 404 Not Found

#### Scenario: Get deleted skill
- **WHEN** 用户发送 GET `/api/v1/skills/{code}` 请求，code 对应已软删除的技能
- **THEN** 系统返回 404 Not Found

### Requirement: Update skill
系统 SHALL 允许管理员更新技能信息，code 除外。更新 content 时，draft 状态将变为 active。

#### Scenario: Update skill with content (draft to active)
- **WHEN** 管理员发送 PUT `/api/v1/skills/{code}` 请求，包含 content 字段
- **AND** 技能当前 status 为 'draft'
- **THEN** 系统更新 content，status 变为 'active'

#### Scenario: Update skill without content
- **WHEN** 管理员发送 PUT `/api/v1/skills/{code}` 请求，不包含 content 字段
- **AND** 技能当前 status 为 'draft'
- **THEN** 系统更新其他字段，status 保持 'draft'

#### Scenario: Update skill with new code
- **WHEN** 管理员发送 PUT `/api/v1/skills/{code}` 请求，包含新的 code 字段
- **THEN** 系统返回 400 Bad Request，错误信息说明 code 不可修改

#### Scenario: Update non-existent skill
- **WHEN** 管理员发送 PUT `/api/v1/skills/{code}` 请求，code 不存在
- **THEN** 系统返回 404 Not Found

### Requirement: Delete skill (soft delete)
系统 SHALL 允许管理员软删除技能。

#### Scenario: Soft delete skill
- **WHEN** 管理员发送 DELETE `/api/v1/skills/{code}` 请求
- **THEN** 系统设置 deleted_at 为当前时间，返回 204 No Content
- **AND** 该技能不再出现在普通列表查询中

#### Scenario: Delete non-existent skill
- **WHEN** 管理员发送 DELETE `/api/v1/skills/{code}` 请求，code 不存在
- **THEN** 系统返回 404 Not Found