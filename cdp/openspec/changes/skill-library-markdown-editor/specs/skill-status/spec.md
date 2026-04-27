## ADDED Requirements

### Requirement: Skill status management
系统 SHALL 支持技能的三态管理：draft（草稿）、active（启用）、disabled（禁用）。

#### Scenario: Create skill as draft
- **WHEN** 管理员发送 POST `/api/v1/skills` 请求创建新技能
- **THEN** 系统创建技能并设置 status 为 'draft'

#### Scenario: Transition from draft to active
- **WHEN** 管理员更新技能 content（PATCH `/api/v1/skills/{code}` 包含 content）
- **AND** 技能的当前 status 为 'draft'
- **THEN** 系统更新 content 并将 status 设置为 'active'

#### Scenario: Disable active skill
- **WHEN** 管理员发送 PATCH `/api/v1/skills/{code}/deactivate` 请求
- **AND** 技能的当前 status 为 'active'
- **THEN** 系统设置 status 为 'disabled'

#### Scenario: Enable disabled skill
- **WHEN** 管理员发送 PATCH `/api/v1/skills/{code}/activate` 请求
- **AND** 技能的当前 status 为 'disabled'
- **THEN** 系统设置 status 为 'active'

#### Scenario: Draft skill remains draft on basic info update
- **WHEN** 管理员发送 PATCH `/api/v1/skills/{code}` 请求，仅更新 name/level/tags/author（不含 content）
- **AND** 技能的当前 status 为 'draft'
- **THEN** 系统更新字段，status 保持 'draft'

### Requirement: Filter skills by status
系统 SHALL 支持按 status 筛选技能列表。

#### Scenario: Filter by status
- **WHEN** 用户发送 GET `/api/v1/skills?status=draft` 请求
- **THEN** 系统只返回 status = 'draft' 的技能

#### Scenario: Filter by multiple statuses
- **WHEN** 用户发送 GET `/api/v1/skills?status=active,disabled` 请求
- **THEN** 系统返回 status = 'active' 或 'disabled' 的技能

#### Scenario: Default list excludes draft skills
- **WHEN** 用户发送 GET `/api/v1/skills` 请求，无 status 参数
- **THEN** 系统默认只返回 status = 'active' 的技能（不包含 draft）

#### Scenario: List draft skills explicitly
- **WHEN** 用户发送 GET `/api/v1/skills?status=draft` 请求
- **THEN** 系统返回 status = 'draft' 的技能