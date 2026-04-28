# Agent Prototype Prompts Spec

## ADDED Requirements

### Requirement: Prompt type tabs

系统 SHALL 显示 6 个 Prompt 类型的 Tab 切换。

#### Scenario: Display type tabs
- **WHEN** 用户进入 Prompts Tab
- **THEN** 系统显示 6 个类型按钮：Soul、Memory、Reasoning、Agents、Workflow、Comm
- **AND** 默认选中 Soul

### Requirement: Markdown editor

Markdown 编辑器 SHALL 支持左侧编辑、右侧预览。

#### Scenario: Display editor
- **WHEN** 用户选择某个 Prompt 类型
- **THEN** 系统显示 Split View：左侧 textarea，右侧渲染预览

#### Scenario: Save prompt
- **WHEN** 用户编辑完内容并点击"保存"
- **THEN** 系统调用 `PUT /api/v1/agent-prototype-prompts/{id}`
- **AND** 保存成功后显示成功提示

#### Scenario: Create new prompt
- **WHEN** 某个类型还没有 prompt
- **THEN** 系统显示"创建"按钮而非"保存"
- **AND** 点击后调用 `POST /api/v1/agent-prototype-prompts`

### Requirement: Version display

保存后 SHALL 显示当前 Prompt 的版本号。

#### Scenario: Display version
- **WHEN** Prompt 加载完成
- **THEN** 系统在编辑器下方显示版本号（如 v1.0.0）