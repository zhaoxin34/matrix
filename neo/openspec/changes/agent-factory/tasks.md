# Agent Factory 开发任务

## 前置条件

- [ ] 数据库迁移脚本准备就绪
- [ ] 理解现有代码结构（参考 agent_prototype 实现）

---

## Phase 1: 后端实现

### 1.1 数据模型

- [x] **创建 Agent 模型**
  - 文件: `backend/src/app/models/agent.py`
  - 字段: id, name, description, prototype_id, prototype_version, workspace_id, model, skills, config, status, created_by, created_at, updated_at
  - 索引: name, workspace_id, prototype_id, status, created_by
  - 约束: uk_agent_workspace_name (workspace_id, name)

### 1.2 Repository

- [x] **创建 AgentRepository**
  - 文件: `backend/src/app/repositories/agent_repository.py`
  - 方法:
    - `create(agent: Agent) -> Agent`
    - `get_by_id(id: int) -> Optional[Agent]`
    - `get_by_name(workspace_id: int, name: str) -> Optional[Agent]`
    - `list(workspace_id: int, filters: dict, pagination: dict) -> Tuple[List[Agent], int]`
    - `update(agent: Agent, data: dict) -> Agent`
    - `delete(agent: Agent) -> None`
    - `update_status(agent: Agent, status: str) -> Agent`

### 1.3 Service

- [x] **创建 AgentService**
  - 文件: `backend/src/app/services/agent_service.py`
  - 方法:
    - `create_agent(workspace_code: str, data: dict, current_user: User) -> Agent`
    - `get_agent(workspace_code: str, agent_id: int) -> Agent`
    - `list_agents(workspace_code: str, filters: dict, pagination: dict) -> dict`
    - `update_agent(workspace_code: str, agent_id: int, data: dict) -> Agent`
    - `delete_agent(workspace_code: str, agent_id: int) -> None`
    - `enable_agent(workspace_code: str, agent_id: int) -> Agent`
    - `disable_agent(workspace_code: str, agent_id: int) -> Agent`
  - 业务逻辑:
    - 创建时验证 name 在 workspace 内唯一
    - 创建时验证 prototype 存在且为 enabled 状态
    - 创建时验证 prototype_version 有效
    - 更新时验证状态允许操作
    - 删除时检查进行中的 Task

### 1.4 API Routes

- [x] **创建 Agent API 路由**
  - 文件: `backend/src/app/api/v1/agents.py`
  - 端点:
    - `GET /` - 列表
    - `GET /{id}` - 详情
    - `POST /` - 创建
    - `PUT /{id}` - 更新
    - `DELETE /{id}` - 删除
    - `PATCH /{id}/enable` - 启用
    - `PATCH /{id}/disable` - 禁用

- [x] **注册路由**
  - 修改: `backend/src/app/api/v1/__init__.py`
  - 添加: `router.include_router(agents.router, prefix="/workspaces/{workspace_code}/agents", tags=["agents"])`

### 1.5 错误码

- [x] **添加 Agent 错误码**
  - 文件: `backend/src/app/core/error_codes.py`
  - 错误码: 2001-2004, 2011-2013

### 1.6 数据库迁移

- [x] **创建 Alembic 迁移**
  - 命令: `alembic revision --autogenerate -m "add agent table"`
  - 或手动创建 SQL 迁移脚本

---

## Phase 2: 前端实现

### 2.1 类型定义

- [x] **创建 Agent 类型**
  - 文件: `frontend/types/agent.ts`
  - 类型: Agent, CreateAgentInput, UpdateAgentInput, AgentListResponse

### 2.2 API Client

- [x] **创建 Agent API Client**
  - 文件: `frontend/lib/api/agent.ts`
  - 函数:
    - `listAgents(workspaceCode, params)`
    - `getAgent(workspaceCode, id)`
    - `createAgent(workspaceCode, data)`
    - `updateAgent(workspaceCode, id, data)`
    - `deleteAgent(workspaceCode, id)`
    - `enableAgent(workspaceCode, id)`
    - `disableAgent(workspaceCode, id)`

### 2.3 页面对接

- [x] **列表页对接**
  - 文件: `frontend/app/(main)/workspace/[workspace_code]/agents/page.tsx`
  - 修改: 将 mockAgents 替换为 API 调用

- [x] **创建页对接**
  - 文件: `frontend/app/(main)/workspace/[workspace_code]/agents/create/page.tsx`
  - 修改: 将表单提交改为调用 createAgent API

- [x] **详情页对接**
  - 文件: `frontend/app/(main)/workspace/[workspace_code]/agents/[id]/page.tsx`
  - 修改: 将 mock 数据替换为 API 调用
  - 添加: 启用/禁用/删除按钮及功能

- [x] **编辑页对接**
  - 文件: `frontend/app/(main)/workspace/[workspace_code]/agents/[id]/edit/page.tsx`
  - 修改: 将表单提交改为调用 updateAgent API

---

## Phase 3: 测试

### 3.1 后端测试


- [x] **单元测试 - Repository**
  - 文件: `tests/unit/test_agent_repository.py`

- [x] **单元测试 - Service**
  - 文件: `tests/unit/test_agent_service.py`

- [x] **集成测试 - API**
  - 文件: `tests/integration/test_agent_api.py`

### 3.2 前端测试

- [ ] **E2E 测试**
  - 测试场景: 创建 Agent → 查看列表 → 编辑 → 启用/禁用 → 删除

---

## Phase 4: 验证

### 4.1 API 手动测试 (curl测试 - 2026-05-29)

- [x] 列表 API - GET /api/v1/workspaces/{workspace_code}/agents ✅
- [x] 创建 API - POST /api/v1/workspaces/{workspace_code}/agents ✅
- [x] 详情 API - GET /api/v1/workspaces/{workspace_code}/agents/{id} ✅
- [x] 更新 API - PUT /api/v1/workspaces/{workspace_code}/agents/{id} ✅
- [x] 删除 API - DELETE /api/v1/workspaces/{workspace_code}/agents/{id} ✅
- [x] 启用 API - PATCH /api/v1/workspaces/{workspace_code}/agents/{id}/enable ✅
- [x] 禁用 API - PATCH /api/v1/workspaces/{workspace_code}/agents/{id}/disable ✅

### 4.2 前端手动测试

- [ ] 前端有路由冲突 (workspaceId vs workspace_code)，暂未测试
- [ ] 需要修复前端路由后进行完整测试

---

## 预估工时

| 模块 | 任务 | 预估时间 |
|------|------|----------|
| 后端 | 数据模型 | 1h |
| 后端 | Repository | 1.5h |
| 后端 | Service | 2h |
| 后端 | API Routes | 2h |
| 后端 | 迁移脚本 | 0.5h |
| 前端 | 类型 + Client | 1h |
| 前端 | 页面对接 (4个) | 3h |
| 测试 | 单元 + 集成 | 2h |
| **总计** | | **13h** |
