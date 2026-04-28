## Why

Agent Prototype 后端已完成，需要构建对应的 React 前端页面，提供原型的 CRUD 操作、Prompts 管理、版本发布与回滚功能。

## What Changes

### 新增页面
- `/agent-prototypes` - 原型列表页
- `/agent-prototypes/new` - 创建原型页
- `/agent-prototypes/[id]` - 原型详情页（含 Tab：基本信息 / Prompts / 版本历史）
- `/agent-prototypes/[id]/edit` - 编辑原型页

### 新增组件
- `AgentPrototypeList` - 列表页组件
- `AgentPrototypeForm` - 创建/编辑表单（包含 prompts）
- `AgentPrototypePrompts` - Prompts 管理（6个类型 Tab + Markdown 编辑器）
- `AgentPrototypeVersions` - 版本历史与回滚
- `PublishDialog` - 发布确认弹窗
- `MarkdownEditor` - Markdown 编辑器（编辑+预览）
- `RollbackDialog` - 回滚确认弹窗

### 新增 API 客户端
- `lib/agentPrototypeApi.ts` - Agent Prototype 相关 API 调用

## Capabilities

### New Capabilities
- `agent-prototype-list`: 原型列表页（搜索、分页、状态筛选）
- `agent-prototype-create`: 创建原型页
- `agent-prototype-detail`: 原型详情页（Tab 切换：基本信息 / Prompts / 版本历史）
- `agent-prototype-edit`: 编辑原型（含 prompts 编辑）
- `agent-prototype-prompts`: Prompts 管理（类型 Tab + Markdown 编辑）
- `agent-prototype-versions`: 版本历史与回滚
- `agent-prototype-publish`: 发布新版本弹窗
- `agent-prototype-toggle-status`: 启用/禁用原型

## Impact

- **前端路由**: 新增 4 个页面路由
- **组件库**: 新增 9 个组件
- **API 客户端**: 新增 `agentPrototypeApi.ts`
- **状态管理**: 无需新增 store（数据在组件内管理）
- **样式**: 复用现有 MUI 主题和布局组件
