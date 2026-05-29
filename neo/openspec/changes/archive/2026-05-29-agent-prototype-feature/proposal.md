## Why

Neo 平台需要提供 Agent Prototype 管理功能，让管理员能够通过 Prompts 灵活定义 Agent 行为，并通过版本化管理实现安全的发布和回滚能力。Agent Factory 需要基于 Prototype 来创建可运行的 Agent，因此 Prototype 管理是整个 Agent 系统的核心基础设施。

## What Changes

### 新增功能
- **Agent Prototype 管理后台**: 管理员可访问的原型管理界面
  - 列表页：查看所有 Prototype，支持按状态筛选和搜索
  - 详情页：查看原型信息，访问版本历史
  - 编辑页：Markdown 编辑器，支持语法高亮和实时预览

- **Prototype CRUD 操作**:
  - 创建 Prototype（初始状态为 draft）
  - 编辑 Prototype Prompts（草稿保存）
  - 删除 Prototype（仅支持 draft 状态）

- **版本发布流程**:
  - 发布当前草稿为新版本
  - 版本号自动递增
  - 变更说明必填
  - 状态变更为 enabled

- **版本历史与回滚**:
  - 查看历史版本列表（含发布时间、变更说明）
  - 回滚到指定版本（复制操作，不删除目标版本）
  - 保留完整回滚历史

- **状态管理**:
  - 禁用/启用 Prototype
  - 状态流转：draft → enabled ↔ disabled

### 数据模型
- `agent_prototype`: 原型主表（名称、prompts、版本、状态）
- `agent_prototype_version`: 版本历史表（版本快照、变更说明）

## Capabilities

### New Capabilities

- `agent-prototype-management`: Agent Prototype 管理功能
  - 后台管理界面（列表、详情、编辑）
  - CRUD 操作（创建、读取、更新、删除）
  - 状态流转控制
  - 管理员权限控制

- `agent-prototype-versioning`: Agent Prototype 版本管理
  - 版本发布（创建快照）
  - 版本历史查询
  - 版本回滚

## Impact

### 受影响的模块
- **前端**: `/admin/agent-prototype/*` 路由页面
- **后端 API**: `/api/v1/agent_prototype` REST API
- **数据库**: 新增 `agent_prototype` 和 `agent_prototype_version` 表

### 依赖关系
- 依赖 `agent-prototype-design.md` 中的概念设计和状态机定义
- 依赖 `agent-database-design.md` 中的数据模型定义
- 为 `agent-factory` 提供 Prototype 数据源

### API 端点
```
/api/v1/agent_prototype
├── GET    /                         # 列表
├── POST   /                         # 创建
├── GET    /{id}                     # 详情
├── PUT    /{id}                     # 更新
├── DELETE /{id}                     # 删除
├── POST   /{id}/publish             # 发布
├── GET    /{id}/versions            # 版本历史
└── POST   /{id}/rollback            # 回滚
```