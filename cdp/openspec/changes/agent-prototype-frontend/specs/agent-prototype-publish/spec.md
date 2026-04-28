# Agent Prototype Publish Spec

## ADDED Requirements

### Requirement: Publish dialog

发布按钮 SHALL 打开一个弹窗，让用户输入变更说明。

#### Scenario: Open publish dialog
- **WHEN** 用户点击"发布"按钮
- **THEN** 系统显示 Dialog，包含：
  - 标题："发布新版本"
  - Textarea：变更说明（可选）
  - 取消和发布按钮

#### Scenario: Close dialog without publishing
- **WHEN** 用户点击"取消"或关闭弹窗
- **THEN** 系统关闭 Dialog，不做任何操作

### Requirement: Publish action

系统 SHALL 在用户确认后调用发布 API。

#### Scenario: Confirm publish
- **WHEN** 用户填写变更说明并点击"发布"
- **THEN** 系统调用 `POST /api/v1/agent-prototypes/{id}/publish`
- **AND** 成功后关闭 Dialog，刷新版本历史和基本信息

#### Scenario: Publish failure
- **WHEN** 发布请求失败
- **THEN** 系统显示错误消息，Dialog 保持打开

### Requirement: Publish from detail page

只有 published 和 draft 状态的原型可以发布。

#### Scenario: Publish button visibility
- **WHEN** 原型状态为 draft 或 archived
- **THEN** "发布"按钮可见
- **WHEN** 原型状态为 published
- **THEN** "发布"按钮不可见