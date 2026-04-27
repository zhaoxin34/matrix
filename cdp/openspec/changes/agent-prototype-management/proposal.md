## Why

需要一个 Agent 原型（Prototype）管理系统，用于创建和管理 AI Agent 实例的模板。每个原型包含 soul、memory、reasoning 等认知层配置，以及 agents、workflow、communication 等组织层配置，支持版本控制和快照历史。

## What Changes

### 新增数据表
- `agent_prototypes`: Agent 原型模板（名称、描述、模型配置、温度、token限制、prompt版本选择）
- `agent_prototype_prompts`: 原型的提示词配置（type, content, version, order_index）
- `agent_prototype_versions`: 原型版本历史（每次发布形成完整快照）

### 新增功能
- Agent 原型的 CRUD 操作
- Agent 原型提示词的 CRUD 操作
- Agent 原型版本发布与历史回溯
- 提示词类型枚举（AgentPromptType）：soul, memory, reasoning, agents, workflow, communication

## Capabilities

### New Capabilities
- `agent-prototype`: Agent 原型管理（创建、编辑、发布、归档）
- `agent-prototype-prompt`: 原型提示词管理（绑定到原型的提示词配置）
- `agent-prototype-version`: 原型版本历史（发布快照与回溯）

### Modified Capabilities
- 无

## Impact

- **数据库**: 新增 3 张表（agent_prototypes, agent_prototype_prompts, agent_prototype_versions）
- **API**: 新增 /api/v1/agent-prototypes 路由及子路由
- **模型**: 新增 SQLAlchemy 模型和 Pydantic Schema
- **枚举**: 新增 AgentPromptType 枚举类