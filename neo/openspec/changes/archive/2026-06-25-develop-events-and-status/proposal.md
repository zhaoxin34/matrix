# Proposal: 开发 Events 和 Status 功能

## Why

事件（Event）和状态（Status）是 Neo 平台知识库的基础数据模型，用于记录和追踪用户在系统中的行为以及实体的属性变化。这些数据为 Agent 提供决策依据，并为后续的用户行为分析和知识图谱构建奠定基础。

当前系统缺乏统一的事件和状态管理能力，需要建立完整的数据模型和 CRUD 操作接口。

## What Changes

- 新增 Event（事件）实体，支持记录"谁在什么时间做了什么"
- 新增 Status（状态）实体，支持记录实体的属性快照
- 提供完整的 RESTful API（列表、详情、创建、更新、删除）
- 支持按事件名称、实体、触发者、时间范围等条件筛选
- 路由已注册到 routing-table.md

## Capabilities

### New Capabilities

- `event-management`: 事件管理功能，包括事件数据的 CRUD 操作、搜索过滤
- `status-management`: 状态管理功能，包括状态快照的 CRUD 操作、来源筛选
- `event-api`: 事件相关的后端 API 接口
- `status-api`: 状态相关的后端 API 接口

### Modified Capabilities

- 无

## Impact

### 影响的代码/模块

- **backend**: 新增 Event 和 Status 相关的 API 路由和服务
- **frontend**: 新增事件管理和状态管理页面（列表、详情、创建、编辑）
- **database**: 新增 `event` 和 `status` 两张数据表

### 受影响的 API

- `GET /api/v1/workspaces/{workspace_code}/events` - 事件列表
- `GET /api/v1/workspaces/{workspace_code}/events/{id}` - 事件详情
- `POST /api/v1/workspaces/{workspace_code}/events` - 创建事件
- `PUT /api/v1/workspaces/{workspace_code}/events/{id}` - 更新事件
- `DELETE /api/v1/workspaces/{workspace_code}/events/{id}` - 删除事件
- `GET /api/v1/workspaces/{workspace_code}/status` - 状态列表
- `GET /api/v1/workspaces/{workspace_code}/status/{id}` - 状态详情
- `POST /api/v1/workspaces/{workspace_code}/status` - 创建状态
- `PUT /api/v1/workspaces/{workspace_code}/status/{id}` - 更新状态
- `DELETE /api/v1/workspaces/{workspace_code}/status/{id}` - 删除状态

### 受影响的页面路由

- `/workspace/{workspace_code}/events` - 事件列表页
- `/workspace/{workspace_code}/events/new` - 创建事件页
- `/workspace/{workspace_code}/events/{id}` - 事件详情页
- `/workspace/{workspace_code}/events/{id}/edit` - 编辑事件页
- `/workspace/{workspace_code}/status` - 状态列表页
- `/workspace/{workspace_code}/status/new` - 创建状态页
- `/workspace/{workspace_code}/status/{id}` - 状态详情页
- `/workspace/{workspace_code}/status/{id}/edit` - 编辑状态页

### 依赖项

- 依赖 `workspace` 服务进行工作空间隔离
- 依赖 `user` 服务进行创建人关联
- sati 系统会调用 Event API 记录用户行为事件
