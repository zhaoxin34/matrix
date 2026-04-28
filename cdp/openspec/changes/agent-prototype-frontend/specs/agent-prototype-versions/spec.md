# Agent Prototype Versions Spec

## ADDED Requirements

### Requirement: Display version history

系统 SHALL 在版本历史 Tab 显示所有版本记录。

#### Scenario: Display version list
- **WHEN** 用户进入版本历史 Tab
- **THEN** 系统显示版本列表，按创建时间倒序
- **AND** 每条记录包含：版本号、变更说明、创建时间、创建人

### Requirement: Rollback to version

系统 SHALL 支持回滚到指定版本。

#### Scenario: Trigger rollback
- **WHEN** 用户点击某版本的"回滚"按钮
- **THEN** 系统弹出确认对话框，显示目标版本信息

#### Scenario: Confirm rollback
- **WHEN** 用户在确认对话框点击"确定"
- **THEN** 系统调用 `POST /api/v1/agent-prototypes/{id}/rollback`
- **AND** 回滚成功后刷新页面，显示新版本状态

### Requirement: Rollback validation

回滚 SHALL 在当前版本与目标版本不同时才能执行。

#### Scenario: Cannot rollback to current version
- **WHEN** 用户尝试回滚到当前版本
- **THEN** 系统显示错误提示："已是当前版本"