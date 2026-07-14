## Why

访谈 Agent（interview agent）等场景下，Workspace 内的不同用途（type）需要明确指定使用哪个 Agent 实例。例如 `expert_interview` 类型对应一个具体的 Agent，`sales_assistant` 对应另一个。当前缺乏这种 type → agent 的映射机制，前端和后端都没有统一的来源来获取"该 type 应该用哪个 Agent"。

本改动新增 `knlg_agent_mapping` 映射表及 CRUD API，把这张映射表作为 single source of truth，由 backend 维护，前端在创建/编辑 Agent 时可查询/配置。

## What Changes

- 新增表 `knlg_agent_mapping`：每条记录表示 `(workspace_id, type) → agent_id` 的映射，`(workspace_id, type)` 唯一
- 新增 5 个 REST 端点：`GET/POST/PUT/DELETE /api/v1/workspaces/{workspace_code}/agent-mappings[/{type}]`
- 新增 Model `AgentMapping`、Repository `AgentMappingRepository`、Service `AgentMappingService`
- Alembic migration 建表（一次性满足 M1 + M2：`UNIQUE KEY (workspace_id, type)` + 索引）
- 配套单元测试（Service + Repository）
- 接口风格与现有 `embedded_sites.py` 的嵌套 router 保持一致

**未变更：**

- 不修改 `agent_prototype.type` 字段的设计（保留作为 prototype 的设计意图标记）
- 不修改 `ai-interview-agent` spec（这是消费方，本次只提供映射机制）
- 不修改 `agent-factory` spec（同上）

## Capabilities

### New Capabilities

- `agent-mapping`: 提供 workspace 内 `(type → agent_id)` 映射的完整 CRUD 能力，含唯一性约束和按 type 查询

### Modified Capabilities

（无。本改动只新增能力，不修改现有 spec 的 REQUIREMENTS。）

## Impact

**影响代码：**

- 新增：
  - `backend/alembic/versions/2026_07_14_003_add_knlg_agent_mapping.py`（migration）
  - `backend/src/app/models/knlg_agent_mapping.py`
  - `backend/src/app/repositories/knlg_agent_mapping_repository.py`
  - `backend/src/app/services/knlg_agent_mapping_service.py`
  - `backend/src/app/schemas/knlg_agent_mapping.py`
  - `backend/src/app/api/v1/agent_mapping.py`
  - `backend/tests/unit/test_knlg_agent_mapping_service.py`
  - `backend/tests/unit/test_knlg_agent_mapping_repository.py`
- 修改：
  - `backend/src/app/models/__init__.py`（导出新 Model）
  - `backend/src/app/repositories/__init__.py`（导出新 Repository）
  - `backend/src/app/services/__init__.py`（导出新 Service）
  - `backend/src/app/schemas/__init__.py`（导出新 Schema）
  - `backend/src/app/api/v1/router.py`（注册新 router）

**API 影响：**

- 5 个新端点：`/api/v1/workspaces/{workspace_code}/agent-mappings[...]`
- 不破坏现有 API

**数据影响：**

- 新增 1 张表 `knlg_agent_mapping`
- 不影响已有数据

**消费方：**

- ai-interview-agent：查询 `type='expert_interview'` 对应的 Agent
- 前端 Agent 配置页：CRUD 映射
