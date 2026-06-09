# Agent Factory 实现

## Why

Agent Factory 是 Neo 平台的核心功能，用于生产和管理 AI Agent。根据产品设计文档 (design/docs/product/workspaces/agent-factory.md)，需要实现：

- Agent 的 CRUD 操作（创建、读取、更新、删除）
- 基于 AgentPrototype 生成 Agent 实例
- Agent 的启用/禁用状态管理
- 前端 UI 与后端 API 的对接

**当前状态**：
- 前端已完成 UI 实现，使用 mock 数据
- 后端尚未实现 Agent 相关 API
- 技术设计文档已完成（design/docs/technical/workspaces/agent-factory.md）

## What Changes

### 后端实现
1. 创建 `Agent` 数据模型
2. 创建 `AgentRepository` 数据访问层
3. 创建 `AgentService` 业务逻辑层
4. 创建 Agent API 路由（7个端点）

### 前端对接
1. Agent 列表页对接 GET API
2. Agent 创建页对接 POST API
3. Agent 详情页对接 GET API
4. Agent 编辑页对接 PUT API
5. 启用/禁用/删除功能对接对应 API

## Capabilities

### New Capabilities

- `agent-factory`: Agent 的生产和管理，包含以下子功能：
  - 基于 Prototype 创建 Agent 实例
  - Agent 的增删改查
  - Agent 状态管理（enabled/disabled/deleted）
  - Agent 运行时配置（temperature, max_tokens, thinking, timeout, retry）

### Modified Capabilities

- 无

## Impact

### 后端 (backend/)
- 新增: `src/app/models/agent.py`
- 新增: `src/app/repositories/agent_repository.py`
- 新增: `src/app/services/agent_service.py`
- 新增: `src/app/api/v1/agents.py`
- 修改: `src/app/api/v1/__init__.py` (注册路由)
- 修改: `src/app/core/error_codes.py` (添加 Agent 错误码)

### 前端 (frontend/)
- 修改: `app/(main)/workspace/[workspace_code]/agents/page.tsx` (对接 API)
- 修改: `app/(main)/workspace/[workspace_code]/agents/create/page.tsx` (对接 API)
- 修改: `app/(main)/workspace/[workspace_code]/agents/[id]/page.tsx` (对接 API)
- 修改: `app/(main)/workspace/[workspace_code]/agents/[id]/edit/page.tsx` (对接 API)
- 新增: `lib/api/agent.ts` (API client)
- 新增: `types/agent.ts` (TypeScript 类型)

### 数据库
- 新增: `agent` 表
- 关联: `workspace`, `agent_prototype`, `users` 表

### API Endpoints
| 方法   | 端点                                                      |
|--------|------------------------------------------------------------|
| GET    | `/api/v1/workspaces/{workspace_code}/agents`              |
| GET    | `/api/v1/workspaces/{workspace_code}/agents/{id}`         |
| POST   | `/api/v1/workspaces/{workspace_code}/agents`              |
| PUT    | `/api/v1/workspaces/{workspace_code}/agents/{id}`         |
| DELETE | `/api/v1/workspaces/{workspace_code}/agents/{id}`         |
| PATCH  | `/api/v1/workspaces/{workspace_code}/agents/{id}/enable`  |
| PATCH  | `/api/v1/workspaces/{workspace_code}/agents/{id}/disable` |

## References

- 产品设计: `design/docs/product/workspaces/agent-factory.md`
- 技术设计: `design/docs/technical/workspaces/agent-factory.md`
- 数据库设计: `design/docs/technical/agents/agent-database-design.md`
- 现有前端代码: `frontend/app/(main)/workspace/[workspace_code]/agents/`
- 现有组件: `frontend/components/agent-factory/`
