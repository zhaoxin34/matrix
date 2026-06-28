## Why

拦截器(Interceptor)是配置在特定网站(EmbeddedSite)上的规则，用于在目标页面上捕获事件并触发 action（生成 Event、采集 Status、弹确认等）。本期仅实现 CRUD 管理功能，Extension 执行部分在后续阶段实现。

当前状态：

- 产品文档已完成（产品功能概述、用户故事）
- 技术文档已完成（数据模型、API 设计、状态机）
- 路由表已注册（列表页、详情页、创建页、编辑页）
- API 路径已统一（符合 rules-api.md）

## What Changes

实现拦截器的完整 CRUD 功能：

### Backend

- 数据库迁移：创建 `interceptors` 表
- Model: `Interceptor` 模型
- Schema: 请求/响应 Pydantic schemas
- Repository: 数据访问层
- API: CRUD 端点
- 单元测试

### Frontend

- 组件：Header、List、Form、Card、Detail
- 页面：列表页、详情页、创建页、编辑页
- 路由：sidebar 导航 + 4 个页面路由

### API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/workspaces/{workspace_code}/interceptors` | 创建 |
| GET | `/api/v1/workspaces/{workspace_code}/interceptors` | 列表 |
| GET | `/api/v1/workspaces/{workspace_code}/interceptors/{id}` | 详情 |
| PUT | `/api/v1/workspaces/{workspace_code}/interceptors/{id}` | 更新 |
| DELETE | `/api/v1/workspaces/{workspace_code}/interceptors/{id}` | 删除 |
| POST | `/api/v1/workspaces/{workspace_code}/interceptors/{id}/enable` | 启用 |
| POST | `/api/v1/workspaces/{workspace_code}/interceptors/{id}/disable` | 禁用 |

## Capabilities

### New Capabilities

- `interceptor-management`: 拦截器的完整 CRUD 管理能力，包括创建、列表、详情、更新、删除、启用/禁用功能

## Impact

### 依赖

- `embedded-sites`: interceptor 关联到 embedded_site_id
- `events`: interceptor 的 after_actions 可触发 Event 上报
- `status`: interceptor 的 actions 可触发 Status 采集

### 受影响系统

- Backend: 新增 `interceptors` 表和相关 API
- Frontend: 新增 interceptor 管理页面
- Database: 新增迁移文件
