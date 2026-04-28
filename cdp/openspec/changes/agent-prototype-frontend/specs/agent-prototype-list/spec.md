# Agent Prototype List Spec

## ADDED Requirements

### Requirement: List page displays prototypes

系统 SHALL 显示原型列表页面，包含搜索框、分页和原型卡片/表格。

#### Scenario: Display prototype list
- **WHEN** 用户访问 `/agent-prototypes`
- **THEN** 系统显示原型列表，包含 ID、名称、版本、状态、创建时间
- **AND** 支持分页（每页 20 条）

#### Scenario: Search prototypes
- **WHEN** 用户在搜索框输入关键词
- **THEN** 系统筛选出名称或描述包含关键词的原型

#### Scenario: Filter by status
- **WHEN** 用户选择状态筛选（draft/published/archived）
- **THEN** 系统只显示对应状态的原型

### Requirement: Navigate to create/detail

系统 SHALL 提供从列表页导航到创建页和详情页的入口。

#### Scenario: Navigate to create
- **WHEN** 用户点击"新建原型"按钮
- **THEN** 系统跳转到 `/agent-prototypes/new`

#### Scenario: Navigate to detail
- **WHEN** 用户点击原型行的"详情"按钮
- **THEN** 系统跳转到 `/agent-prototypes/{id}`

### Requirement: Delete prototype

系统 SHALL 支持从列表页删除 draft 状态的原型。

#### Scenario: Delete draft prototype
- **WHEN** 用户点击删除按钮（仅 draft 状态显示）
- **THEN** 系统弹出确认对话框
- **AND** 用户确认后，删除原型并刷新列表

#### Scenario: Cannot delete non-draft prototype
- **WHEN** 用户尝试删除 published 或 archived 状态的原型
- **THEN** 删除按钮不显示或禁用