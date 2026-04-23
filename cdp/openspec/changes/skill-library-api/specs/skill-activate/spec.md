## ADDED Requirements

### Requirement: Activate skill
系统 SHALL 允许管理员启用被禁用的技能。

#### Scenario: Activate skill successfully
- **WHEN** 管理员发送 PATCH `/api/v1/skills/{code}/activate` 请求
- **THEN** 系统设置 is_active = true，updated_at 更新，返回 200 OK

#### Scenario: Activate already active skill
- **WHEN** 管理员发送 PATCH `/api/v1/skills/{code}/activate` 请求，技能已是 active 状态
- **THEN** 系统返回 200 OK，is_active 保持 true

#### Scenario: Activate non-existent skill
- **WHEN** 管理员发送 PATCH `/api/v1/skills/{code}/activate` 请求，code 不存在
- **THEN** 系统返回 404 Not Found

### Requirement: Deactivate skill
系统 SHALL 允许管理员禁用技能。

#### Scenario: Deactivate skill successfully
- **WHEN** 管理员发送 PATCH `/api/v1/skills/{code}/deactivate` 请求
- **THEN** 系统设置 is_active = false，updated_at 更新，返回 200 OK

#### Scenario: Deactivate already inactive skill
- **WHEN** 管理员发送 PATCH `/api/v1/skills/{code}/deactivate` 请求，技能已是 inactive 状态
- **THEN** 系统返回 200 OK，is_active 保持 false

#### Scenario: Deactivate non-existent skill
- **WHEN** 管理员发送 PATCH `/api/v1/skills/{code}/deactivate` 请求，code 不存在
- **THEN** 系统返回 404 Not Found
