# Agent Prototype Prompt Spec

## ADDED Requirements

### Requirement: Prototype Prompt CRUD

系统 SHALL 提供原型提示词的完整 CRUD 操作。

#### Scenario: Create prompt
- **WHEN** 用户创建一个新的 Prototype Prompt，包含 prototype_id、type、name、content、version
- **THEN** 系统创建提示词记录，生成 UUID，返回完整信息

#### Scenario: List prompts by prototype
- **WHEN** 用户请求某个原型的所有提示词
- **THEN** 系统返回该原型关联的所有 prompts，按 type 和 order_index 排序

#### Scenario: Get prompt detail
- **WHEN** 用户请求某个提示词的详情
- **THEN** 系统返回提示词的完整信息，包括 content

#### Scenario: Update prompt
- **WHEN** 用户更新某个提示词的 content、name 或 order_index
- **THEN** 系统更新提示词信息，更新 updated_at 和 updated_by
- **AND** 如果 content 变更，可以选择创建新版本（version bump）

#### Scenario: Delete prompt
- **WHEN** 用户删除一个提示词
- **THEN** 系统删除提示词记录
- **AND** 如果有原型引用该 version，更新原型的 prompt_selections

### Requirement: Prompt Type Management

系统 SHALL 支持 AgentPromptType 枚举的所有类型。

#### Scenario: Valid prompt types
- **WHEN** 用户创建提示词时指定 type
- **THEN** 系统验证 type 必须是 AgentPromptType 枚举值之一（soul, memory, reasoning, agents, workflow, communication）

#### Scenario: Invalid prompt type
- **WHEN** 用户创建提示词时指定无效的 type
- **THEN** 系统返回 422 错误，无效的 prompt type

### Requirement: Prompt Version Management

系统 SHALL 支持提示词的版本管理。

#### Scenario: Create new prompt version
- **WHEN** 用户更新已存在的 prompt（相同 prototype_id + type + 相近 version）
- **THEN** 系统可以创建新版本的 prompt（version bump，如 1.0.0 → 1.1.0）

#### Scenario: Query prompt by version
- **WHEN** 用户指定 prototype_id、type、version 查询提示词
- **THEN** 系统返回指定版本的提示词内容

### Requirement: Prompt Content

系统 SHALL 支持 Markdown 格式的提示词内容。

#### Scenario: Store markdown content
- **WHEN** 用户创建或更新提示词的 content
- **THEN** 系统以 TEXT 格式存储 Markdown 内容，不做解析或验证

#### Scenario: Empty content validation
- **WHEN** 用户创建提示词时 content 为空
- **THEN** 系统返回 422 错误，content 不能为空

### Requirement: Prompt Order

系统 SHALL 支持提示词的排序。

#### Scenario: Set prompt order
- **WHEN** 用户设置提示词的 order_index
- **THEN** 系统存储 order_index，用于同类型内的排序显示

#### Scenario: Default order
- **WHEN** 用户创建提示词时未指定 order_index
- **THEN** 系统设置 order_index 为 0