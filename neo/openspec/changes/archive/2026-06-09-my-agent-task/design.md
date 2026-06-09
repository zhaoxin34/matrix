## Context

### 当前状态

任务管理已完成工作区视角（`/workspace/{code}/tasks`），Task 表有 `owner_id` 字段表示任务归属。

### 需求背景

用户需要在个人中心跨工作区查看自己相关的任务：
- **我创建的**：creator_id = current_user
- **我执行的**：executor_id = current_user

### 约束

1. **字段变更**：删除旧数据后重建表
2. **向后兼容**：仅影响任务管理模块
3. **登录验证**：所有 API 需要登录用户信息

## Goals / Non-Goals

**Goals:**
- 新增 `executor_id` 字段表示执行人
- 重命名 `owner_id` → `creator_id`
- 新增跨工作区「我的任务」API
- 新增个人中心「我的任务」页面
- 更新现有任务管理功能（显示执行人）

**Non-Goals:**
- 任务执行逻辑（由 Agent 模块处理）
- 任务暂停/继续功能（UI 显示"暂不支持"）
- 权限细粒度控制

## Decisions

### 1. Task 表字段变更策略

**决策**：删除旧数据，直接重建表结构

**理由**：
- 当前任务管理是演示项目，数据量小
- `owner_id` → `creator_id` 是重命名，直接 ALTER 复杂
- 直接删除旧 migration，重新生成更简洁

**备选方案**：
- ALTER TABLE 重命名列（需处理数据迁移）
- 新增 nullable 字段，逐步迁移（过于复杂）

### 2. executor_id 默认值策略

**决策**：创建任务时必须指定 `executor_id`，默认取 Agent 的 Owner

**理由**：
- 派发任务天然有执行人
- 周期任务的执行人默认是 Agent Owner
- 允许创建时手动指定其他执行人

### 3. 我的任务 API 设计

**端点**：`GET /api/v1/tasks/me`

**筛选逻辑**：
```
默认: creator_id = current_user OR executor_id = current_user
my_role=creator: creator_id = current_user
my_role=executor: executor_id = current_user
```

**响应增加字段**：
- `workspace_id`, `workspace_code`, `workspace_name` - 所属工作区
- `my_role` - 当前用户的角色（creator/executor）

### 4. 前端页面复用策略

**决策**：复用现有任务列表组件，新增筛选器和展示逻辑

**理由**：
- 任务卡片组件可复用
- 只需新增"我的角色"徽章和"所属工作区"列
- 筛选逻辑通过 API 参数控制

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 字段变更需删除旧数据 | 文档已明确「删除老数据」，与用户确认 |
| 跨工作区查询性能 | 在 `creator_id` 和 `executor_id` 上建立索引 |
| 前端 hydration 报错 | 使用按钮式筛选器替代 Select 组件 |

## Open Questions

1. ~~executor_id 默认值~~ → 已解决：取 Agent Owner
2. ~~历史数据处理~~ → 已解决：删除旧数据
3. 派发任务的执行人是否需要二次确认？ → 暂不需要，后续可扩展
