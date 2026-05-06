# Agent Prototype Version Spec

## ADDED Requirements

### Requirement: Version Snapshot Creation

系统 SHALL 在每次发布时创建完整的版本快照。

#### Scenario: Publish creates snapshot
- **WHEN** 用户发布一个原型（调用 publish 接口）
- **THEN** 系统创建 agent_prototype_versions 记录，包含：
  - prompts_snapshot: 完整的 prompts JSON
  - config_snapshot: {model, temperature, max_tokens, status}
  - change_summary: 用户提供的变更说明

#### Scenario: Auto-increment version
- **WHEN** 用户发布原型时未指定 version
- **THEN** 系统自动递增版本号（如 1.0.0 → 1.0.1）

#### Scenario: Specify version
- **WHEN** 用户发布原型时指定新 version（如 2.0.0）
- **THEN** 系统使用指定的 version 创建快照

### Requirement: Version History Retrieval

系统 SHALL 提供版本历史的查询接口。

#### Scenario: List all versions
- **WHEN** 用户请求某个原型的所有版本
- **THEN** 系统返回版本列表，按 created_at 降序排列
- **AND** 包含 version、change_summary、created_at、created_by

#### Scenario: Get specific version detail
- **WHEN** 用户请求某个版本的详细信息
- **THEN** 系统返回该版本的完整快照（prompts_snapshot 和 config_snapshot）

### Requirement: Version Rollback

系统 SHALL 支持回滚到历史版本。

#### Scenario: Rollback to version
- **WHEN** 用户请求回滚到指定 version
- **THEN** 系统从快照恢复以下内容到 agent_prototypes：
  - prompts（来自 prompts_snapshot）
  - model, temperature, max_tokens（来自 config_snapshot）
- **AND** 创建新的版本记录（标记为 rollback 操作）

#### Scenario: Cannot rollback to current version
- **WHEN** 用户请求回滚到当前版本
- **THEN** 系统返回错误：已是当前版本

### Requirement: Version Uniqueness

系统 SHALL 确保每个原型的版本号唯一。

#### Scenario: Duplicate version prevention
- **WHEN** 用户尝试发布一个已存在的 version
- **THEN** 系统返回 409 错误：版本号已存在

### Requirement: Version Change Summary

系统 SHALL 要求用户填写变更说明。

#### Scenario: Require change summary
- **WHEN** 用户发布原型时未提供 change_summary
- **THEN** 系统可以允许（change_summary 为可选）或要求必填（根据业务需求）

#### Scenario: View change summary
- **WHEN** 用户查看版本历史
- **THEN** 系统显示每个版本的 change_summary
