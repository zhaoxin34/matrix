---
id: workspace
title: workspace技术设计
author: Joky.Zhao
created: 2026-05-12
updated: 2026-05-14
version: 1.1.0
tags: [技术设计, Workspace]
---

## 路由设计

> ⚠️ 根据产品设计变更，Workspace 路由已按角色分层。

### Admin 端路由（仅限 admin 角色）

| 路由 | 功能 | 页面文件 |
| ---- | ---- | -------- |
| `/admin/workspace` | Workspace 列表页 | `app/admin/workspace/page.tsx` |
| `/admin/workspace/new` | 创建 Workspace | `app/admin/workspace/new/page.tsx` |
| `/admin/workspace/{workspace_id}/settings` | Workspace 设置页 | `app/admin/workspace/[workspace_id]/settings/page.tsx` |

### User 端路由（普通用户）

| 路由 | 功能 | 页面文件 |
| ---- | ---- | -------- |
| `/workspace` | 我的 Workspace | `app/workspace/page.tsx` |
| `/workspace/{workspace_id}` | Workspace 详情页 | `app/workspace/[workspace_id]/page.tsx` |

### 路由分层原则

- **`/admin/workspace/*`**: Admin 专用路由，用于创建、配置和管理 Workspace
- **`/workspace/*`**: 普通用户路由，用于使用已授权的 Workspace

---

## 🎨 Workspace CRUD 操作设计

### 3.1 创建(Create)

**API 端点**:`POST /api/v1/workspaces`

**请求体**:

```json
{
  "name": "研发一部",
  "description": "研发中心第一个团队"
}
```

**响应**:

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 1876543210,
    "name": "研发一部",
    "code": "yan-fa-yi-bu",
    "description": "研发中心第一个团队",
    "status": "active",
    "org_id": 10001,
    "owner_id": 1234567890,
    "created_at": "2026-05-12T10:00:00Z",
    "updated_at": "2026-05-12T10:00:00Z"
  },
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

**错误场景**:
| 错误码 | 说明 | 处理方式 |
| ------ | ---- | -------- |
| `1001` | Invalid Parameter（名称为空或超长） | 返回 400,提示具体字段 |
| `3001` | Name Conflict（名称已存在） | 返回 409,提示冲突 |
| `1002` | Unauthorized（无权创建） | 返回 401/403 |

### 3.2 读取(Read)

**列表**:`GET /api/v1/workspaces`

**查询参数**:
| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| `status` | enum | 按状态过滤 (`active`, `disabled`) |
| `page` | int | 页码,默认 1 |
| `page_size` | int | 每页数量,默认 20 |
| `search` | string | 按名称搜索(模糊匹配) |

**详情**:`GET /api/v1/workspaces/{workspace_id}`

> **字段说明**: 为保持与产品设计一致，响应中返回 `owner_id`。如需获取所有者详细信息，可调用 `GET /api/v1/users/{owner_id}` 获取。

**响应**:

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 1876543210,
    "name": "研发一部",
    "code": "yan-fa-yi-bu",
    "description": "研发中心第一个团队",
    "status": "active",
    "org_id": 10001,
    "owner_id": 1234567890,
    "member_count": 15,
    "project_count": 8,
    "created_at": "2026-05-12T10:00:00Z",
    "updated_at": "2026-05-12T10:00:00Z"
  },
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

### 3.3 更新(Update)

**API 端点**:`PATCH /api/v1/workspaces/{workspace_id}`

**请求体**:

```json
{
  "name": "研发二部",
  "description": "更新后的描述"
}
```

**可编辑字段**:

- `name`:Workspace 名称
- `description`:描述信息

**不可编辑字段**:

- `id`:全局唯一标识
- `code`:URL 标识(不可变)
- `owner_id`:所有者(通过转移所有权接口变更)
- `created_at`:创建时间

### 3.4 删除(Disable)

> ⚠️ **重要**:Workspace 不支持物理删除,仅支持禁用。

**API 端点**:`POST /api/v1/workspaces/{workspace_id}/disable`

**请求体**:空

**响应**:

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 1876543210,
    "status": "disabled",
    "org_id": 10001,
    "disabled_at": "2026-05-12T12:00:00Z",
    "disabled_by": 1234567890
  },
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

**反向操作**:`POST /api/v1/workspaces/{workspace_id}/enable`

---

## 📋 Workspace 设置页面结构

```
Workspace 设置
├── 基本信息
│   ├── 名称
│   ├── code(只读)
│   ├── 描述
│   └── 创建时间
├── 所有者
│   ├── 当前所有者信息
│   └── 转移所有权
├── 成员管理
│   ├── 成员列表
│   ├── 邀请成员
│   └── 角色分配
├── 安全设置
│   ├── 访问控制策略
│   └── SSO 配置(预留)
└── 高级设置
    ├── 禁用 Workspace
    └── 导出数据
```

---

---

## 🔗 相关文档

- [ Workspace 产品设计 ](../product/workspace)
- [ 路由表 ](../product/routing-table)
- 数据库设计文档 (TODO)
- 权限系统设计文档 (TODO)
