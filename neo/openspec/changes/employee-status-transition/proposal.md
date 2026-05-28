## Why

当前组织管理功能中，新添加的员工无法进行状态流转。例如员工状态为"入职中"时，无法将其变更为"在职"。需要在员工列表中提供状态流转的操作入口，使管理员能够便捷地执行员工状态变更。

## What Changes

- 在员工列表的操作列添加 Dropdown 菜单按钮
- 支持以下状态流转操作：
  - `onboarding → on_job`: 完成入职
  - `on_job → transferring`: 发起调动
  - `on_job → offboarding`: 发起离职
  - `transferring → on_job`: 完成调动
  - `transferring → on_job`: 取消调动（回到在职）
  - `offboarding → onboarding`: 重新入职
- 操作点击后立即生效，无需二次确认弹窗
- 操作成功后显示 Toast 提示，列表自动刷新

## Capabilities

### New Capabilities
- `employee-status-transition`: 员工状态流转能力，支持员工状态的单向变更操作

## Impact

- **UI 修改**: `ui/app/admin/org-structure/page.tsx` - 添加操作按钮和状态流转逻辑
- **Mock 数据**: 扩展 mockEmployees 的状态管理（如果后续需要连接后端 API）