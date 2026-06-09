# my-agent-task spec

## Purpose

This capability provides users with a "My Tasks" view that aggregates tasks across all workspaces where they are either the creator or executor.

*(Detailed purpose statement TBD)*

## Requirements

### Requirement: 我的任务列表
系统 SHALL 提供跨工作区的「我的任务」功能，用户可以查看自己相关的所有任务。

#### Scenario: 查看我的任务列表
- **WHEN** 用户访问 `/tasks` 页面
- **THEN** 系统显示当前用户相关的所有任务（创建者或执行者）

#### Scenario: 筛选我创建的任务
- **WHEN** 用户点击「我创建的」筛选器
- **THEN** 系统只显示 `creator_id = current_user` 的任务

#### Scenario: 筛选我执行的任务
- **WHEN** 用户点击「我执行的」筛选器
- **THEN** 系统只显示 `executor_id = current_user` 的任务

#### Scenario: 按执行状态筛选
- **WHEN** 用户选择执行状态筛选条件
- **THEN** 系统只显示匹配 `last_exec_status` 的任务

#### Scenario: 按任务类型筛选
- **WHEN** 用户选择任务类型筛选条件
- **THEN** 系统只显示匹配 `task_type` 的任务

#### Scenario: 按优先级筛选
- **WHEN** 用户选择优先级筛选条件
- **THEN** 系统只显示匹配 `priority` 的任务

#### Scenario: 分页加载
- **WHEN** 用户查看任务列表
- **THEN** 系统支持分页加载，每页 20 条

### Requirement: 我的任务显示字段
我的任务列表 SHALL 显示以下字段。

#### Scenario: 显示所属工作区
- **WHEN** 用户查看任务列表
- **THEN** 每条任务显示 `workspace_name`（所属工作区名称）

#### Scenario: 显示我的角色徽章
- **WHEN** 用户查看任务列表
- **THEN** 每条任务显示「创建者」或「执行者」徽章（`my_role`）

#### Scenario: 显示执行人
- **WHEN** 用户查看任务列表
- **THEN** 每条任务显示 `executor_name`（执行人姓名）

### Requirement: 我的任务详情
用户 SHALL 能够查看任务详情。

#### Scenario: 查看任务详情
- **WHEN** 用户点击任务列表中的任务
- **THEN** 系统跳转到任务详情页

#### Scenario: 任务详情显示完整信息
- **WHEN** 用户查看任务详情
- **THEN** 系统显示任务完整信息，包括 creator_name、executor_name

### Requirement: 我的任务 API
后端 SHALL 提供「我的任务」API。

#### Scenario: 获取我的任务列表
- **WHEN** 调用 `GET /api/v1/tasks/me`
- **THEN** 返回当前用户相关的任务列表

#### Scenario: API 筛选参数
- **WHEN** 调用 `GET /api/v1/tasks/me?my_role=creator`
- **THEN** 只返回 `creator_id = current_user` 的任务

#### Scenario: API 响应包含工作区信息
- **WHEN** 调用 `GET /api/v1/tasks/me`
- **THEN** 响应包含 `workspace_id`、`workspace_code`、`workspace_name`、`my_role`

### Requirement: Task 字段变更
Task 表 SHALL 包含 `creator_id` 和 `executor_id` 字段。

#### Scenario: creator_id 表示创建人
- **WHEN** 创建任务时
- **THEN** `creator_id` 必填，表示任务创建人

#### Scenario: executor_id 表示执行人
- **WHEN** 创建任务时
- **THEN** `executor_id` 必填，表示任务执行人（默认取 Agent Owner）

### Requirement: 创建任务需要指定执行人
创建任务时 SHALL 必须指定执行人。

#### Scenario: 创建周期任务
- **WHEN** 用户创建周期任务
- **THEN** 必须选择 `executor_id`（执行人）

#### Scenario: 执行人默认值
- **WHEN** 用户选择 Agent 后
- **THEN** `executor_id` 默认填充为该 Agent 的 Owner