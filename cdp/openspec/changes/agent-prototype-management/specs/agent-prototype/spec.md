# Agent Prototype Spec

## ADDED Requirements

### Requirement: Agent Prototype CRUD

系统 SHALL 提供 Agent 原型的完整 CRUD 操作，包括创建、读取、更新、删除和列表查询。

#### Scenario: Create prototype
- **WHEN** 用户创建一个新的 Agent Prototype，包含 name、description、model、temperature、max_tokens
- **THEN** 系统创建一个 draft 状态的原型，生成 UUID，返回完整的原型信息

#### Scenario: List prototypes
- **WHEN** 用户请求原型列表
- **THEN** 系统返回分页的原型列表，包含 id、name、version、status、created_at

#### Scenario: Get prototype detail
- **WHEN** 用户请求某个原型的详情
- **THEN** 系统返回原型完整信息，包括 prompt_selections 和关联的 prompts

#### Scenario: Update prototype
- **WHEN** 用户更新原型的配置（model、temperature、max_tokens、name、description）
- **THEN** 系统更新原型信息，更新 updated_at 和 updated_by

#### Scenario: Delete prototype
- **WHEN** 用户删除一个 draft 状态的原型
- **THEN** 系统级联删除该原型及其所有关联的 prompts
- **AND** 系统返回删除成功

#### Scenario: Cannot delete non-draft prototype
- **WHEN** 用户尝试删除一个 published 或 archived 状态的原型
- **THEN** 系统返回错误：只能删除 draft 状态的原型

### Requirement: Prototype Prompt Selections

系统 SHALL 支持通过 prompt_selections JSON 字段管理每个 Prompt 类型的版本选择。

#### Scenario: Update prompt selection
- **WHEN** 用户更新某个原型的 prompt_selections
- **THEN** 系统验证 JSON 格式正确，且引用的 prompt 版本存在
- **AND** 更新原型的 prompt_selections 字段

### Requirement: Prototype Status Lifecycle

系统 SHALL 支持原型的状态流转：draft → published → archived。

#### Scenario: Publish prototype
- **WHEN** 用户发布一个 draft 或 archived 状态的原型
- **THEN** 系统创建新版本快照，记录到 agent_prototype_versions
- **AND** 更新原型状态为 published

#### Scenario: Archive prototype
- **WHEN** 用户归档一个 published 状态的原型
- **THEN** 系统更新原型状态为 archived

#### Scenario: Reactivate archived prototype
- **WHEN** 用户重新激活一个 archived 状态的原型
- **THEN** 系统更新原型状态为 draft

### Requirement: Prototype Version History

系统 SHALL 支持原型的版本历史查询和回滚。

#### Scenario: Get version history
- **WHEN** 用户请求某个原型的版本历史
- **THEN** 系统返回该原型的所有版本记录，包含 version、change_summary、created_at、created_by

#### Scenario: Rollback to specific version
- **WHEN** 用户请求回滚到指定版本
- **THEN** 系统从快照恢复 config 和 prompt_selections
- **AND** 创建新的版本记录（回滚操作本身也记录为新版本）
- **AND** 更新原型的当前配置

### Requirement: Prototype Validation

系统 SHALL 在创建和更新时进行数据校验。

#### Scenario: Required fields validation
- **WHEN** 用户创建原型时缺少必填字段（name、model）
- **THEN** 系统返回 422 错误，指明缺失字段

#### Scenario: Version format validation
- **WHEN** 用户指定无效的 version 格式
- **THEN** 系统返回 422 错误，version 必须符合 semver 格式

#### Scenario: Temperature range validation
- **WHEN** 用户设置 temperature 不在 0-2 范围内
- **THEN** 系统返回 422 错误