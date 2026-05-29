# Agent Factory 规格说明

## Overview

Agent Factory 用于在 Workspace 下生产和管理 Agent 实例。

## Data Model

### Agent Entity

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| name | VARCHAR(32) | NOT NULL, INDEX | Agent 名称，workspace 内唯一 |
| description | TEXT | NULL | 描述信息 |
| prototype_id | BIGINT | FK → agent_prototype.id, NOT NULL | 引用的 Prototype |
| prototype_version | VARCHAR(32) | NOT NULL | 基于的 Prototype 版本号 |
| workspace_id | BIGINT | FK → workspace.id, NOT NULL, INDEX | 所属 Workspace |
| model | VARCHAR(64) | NOT NULL | 模型配置 |
| skills | JSON | NOT NULL, DEFAULT '[]' | 启用的技能列表 |
| config | JSON | NOT NULL, DEFAULT '{}' | 运行时配置 |
| status | ENUM | NOT NULL, DEFAULT 'enabled' | 状态 |
| created_by | BIGINT | FK → users.id, NOT NULL | 创建人 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

### AgentConfig 结构

```json
{
  "temperature": 0.7,
  "max_tokens": 4096,
  "thinking": "low",
  "timeout": 60,
  "retry": {
    "max_attempts": 3,
    "backoff": "exponential"
  }
}
```

## API Specification

### 1. List Agents

```
GET /api/v1/workspaces/{workspace_code}/agents
```

**Query Parameters:**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码 |
| page_size | integer | 否 | 20 | 每页数量 |
| status | string | 否 | - | enabled / disabled |
| prototype_id | bigint | 否 | - | 按 Prototype 筛选 |
| search | string | 否 | - | 搜索 name / description |

**Response:**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "page_size": 20,
    "total_pages": 5
  }
}
```

### 2. Get Agent

```
GET /api/v1/workspaces/{workspace_code}/agents/{id}
```

**Response:**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "name": "my-agent",
    "description": "...",
    "prototype_id": 1,
    "prototype_version": "1.0.0",
    "workspace_id": 1,
    "model": "gpt-4o",
    "skills": [...],
    "config": {...},
    "status": "enabled",
    "created_by": 1,
    "created_at": "2026-05-29T10:00:00Z",
    "updated_at": "2026-05-29T10:00:00Z"
  }
}
```

### 3. Create Agent

```
POST /api/v1/workspaces/{workspace_code}/agents
```

**Request Body:**
```json
{
  "name": "my-agent",
  "description": "...",
  "prototype_id": 1,
  "prototype_version": "1.0.0",
  "model": "gpt-4o",
  "skills": [{"id": 1, "version": "1.0.0"}],
  "config": {
    "temperature": 0.8
  }
}
```

**Validation:**
- name: 必填，32字符内，workspace 内唯一
- prototype_id: 必填，必须引用 enabled 状态的 Prototype
- prototype_version: 必填，必须是 Prototype 的有效版本

### 4. Update Agent

```
PUT /api/v1/workspaces/{workspace_code}/agents/{id}
```

**Request Body:**
```json
{
  "name": "my-agent-v2",
  "description": "...",
  "model": "gpt-4o-turbo",
  "skills": [...],
  "config": {...}
}
```

**Constraints:**
- prototype_id 和 prototype_version 不可修改
- 仅 enabled / disabled 状态的 Agent 可更新

### 5. Delete Agent

```
DELETE /api/v1/workspaces/{workspace_code}/agents/{id}
```

- 执行软删除，设置 status = 'deleted'
- 删除前检查是否有进行中的 Task
- 删除后可恢复（恢复为 disabled 状态）

### 6. Enable Agent

```
PATCH /api/v1/workspaces/{workspace_code}/agents/{id}/enable
```

### 7. Disable Agent

```
PATCH /api/v1/workspaces/{workspace_code}/agents/{id}/disable
```

## State Machine

```
     [*] --> enabled: 创建
     enabled --> disabled: 禁用
     disabled --> enabled: 启用
     enabled --> deleted: 删除
     disabled --> deleted: 删除
     deleted --> enabled: 恢复
```

| 状态 | Task 调度 | 接收新任务 | 正在执行的任务 |
|------|-----------|------------|----------------|
| enabled | ✅ 允许 | ✅ 允许 | ✅ 继续执行 |
| disabled | ❌ 暂停 | ❌ 拒绝 | ✅ 继续执行 |
| deleted | ❌ 禁止 | ❌ 拒绝 | ❌ 中断执行 |

## Error Codes

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| 0 | 成功 | 200 |
| 1001 | 参数验证失败 | 400 |
| 1004 | 资源不存在 | 404 |
| 2001 | Agent 不存在 | 404 |
| 2002 | Agent 名称已存在 | 409 |
| 2003 | Agent 状态不允许此操作 | 409 |
| 2004 | 存在进行中的 Task | 409 |
| 2011 | Prototype 不存在 | 404 |
| 2012 | Prototype 未发布 | 400 |
| 2013 | Prototype 版本不存在 | 400 |

## Acceptance Criteria

### 后端
- [ ] Agent 模型正确创建，包含所有字段
- [ ] Repository 实现 CRUD 操作
- [ ] Service 实现业务逻辑和状态机
- [ ] API 端点响应格式符合规范
- [ ] 错误码正确返回
- [ ] 权限检查：workspace 成员可 CRUD

### 前端
- [ ] 列表页正确显示 Agent 数据
- [ ] 创建页表单验证正确
- [ ] 创建页调用 POST API
- [ ] 详情页正确显示 Agent 信息
- [ ] 编辑页调用 PUT API
- [ ] 删除功能调用 DELETE API
- [ ] 启用/禁用功能调用对应 API
