## Why

当前任务管理只有工作区视角，用户无法跨工作区查看自己相关的任务。需要新增「我的任务」功能，让用户能看到自己创建的和自己执行的所有任务。

## What Changes

1. **Task 表字段变更**
   - `owner_id` → `creator_id`（重命名，消除歧义）
   - 新增 `executor_id`（必填）表示任务执行人

2. **新增「我的任务」API**
   - `GET /api/v1/tasks/me` - 跨工作区获取当前用户相关任务

3. **新增「我的任务」页面**
   - 路由：`/tasks`
   - 入口：个人中心侧边栏「我的任务」链接

4. **列表增强**
   - 新增「执行人」列
   - 新增「所属工作区」列（我的任务页面）
   - 新增「我的角色」徽章（创建者/执行者）
   - 新增筛选器（全部/我创建的/我执行的）

## Capabilities

### New Capabilities

- `my-agent-task`: 跨工作区的「我的任务」视图，支持按创建者/执行者筛选

### Modified Capabilities

- `task-management`: 任务管理需求变更
  - 字段变更：`owner_id` → `creator_id`，新增 `executor_id`
  - 创建任务时必须指定 `executor_id`（默认取 Agent 的 Owner）
  - 删除旧数据（`owner_id` 相关逻辑需同步更新）

## Impact

| 影响范围 | 说明 |
|----------|------|
| **数据库** | Task 表增加 `executor_id` 字段，重命名 `owner_id` → `creator_id` |
| **后端 API** | 新增 `/api/v1/tasks/me` 接口 |
| **前端** | 新增 `/tasks` 页面，更新现有任务相关页面 |
| **已有代码** | 任务相关的 Model、Schema、Repository、Service 需同步更新 |
