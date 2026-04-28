# Agent Prototype Create Spec

## ADDED Requirements

### Requirement: Create page form fields

创建页 SHALL 包含以下表单字段：name、description、model、temperature、max_tokens。

#### Scenario: Display create form
- **WHEN** 用户访问 `/agent-prototypes/new`
- **THEN** 系统显示表单，包含：
  - Name（必填，最多 255 字符）
  - Description（可选）
  - Model（必填，最多 100 字符）
  - Temperature（默认 0.7，范围 0-2）
  - Max Tokens（默认 4096，最小 1）

#### Scenario: Validation on submit
- **WHEN** 用户点击"创建"按钮但必填字段为空
- **THEN** 系统显示错误提示，不提交表单

### Requirement: Submit creates prototype

系统 SHALL 在表单提交成功后调用后端 API 创建原型。

#### Scenario: Successful creation
- **WHEN** 用户填写所有必填字段并点击"创建"
- **THEN** 系统调用 `POST /api/v1/agent-prototypes`
- **AND** 成功后跳转到详情页 `/agent-prototypes/{id}`

#### Scenario: Creation failure
- **WHEN** 创建请求失败
- **THEN** 系统显示错误消息，表单保持填写状态