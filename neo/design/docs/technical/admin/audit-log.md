---
id: audit-log
title: 审计日志设计
author: Joky.Zhao
created: 2026-05-27
updated: 2026-05-27
version: 1.0.0
tags: [技术设计, 审计日志]
---

## 概述

审计日志用于记录 Workspace 相关的所有敏感操作，便于安全审计、合规审查和问题排查。

## 审计范围

### Workspace 核心操作

| 操作 | action | 说明 |
|------|--------|------|
| 创建 Workspace | `workspace:create` | 记录创建的基本信息 |
| 更新 Workspace | `workspace:update` | 记录变更前后的值 |
| 禁用 Workspace | `workspace:disable` | 记录禁用原因和操作人 |
| 启用 Workspace | `workspace:enable` | 记录启用操作 |
| 转移所有权 | `workspace:transfer_owner` | 记录原所有者和新所有者 |

### 成员管理操作

| 操作 | action | 说明 |
|------|--------|------|
| 添加成员 | `member:add` | 记录被添加的用户和角色 |
| 更新成员角色 | `member:update` | 记录角色变更前后 |
| 移除成员 | `member:remove` | 记录被移除的用户 |

## 数据库设计

### audit_logs 表

```sql
CREATE TABLE `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `workspace_id` INT UNSIGNED NOT NULL COMMENT 'Workspace ID',
    `user_id` INT UNSIGNED NOT NULL COMMENT '操作用户 ID',
    `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
    `target_type` VARCHAR(50) NOT NULL COMMENT '目标资源类型',
    `target_id` INT UNSIGNED DEFAULT NULL COMMENT '目标资源 ID',
    `before_value` JSON DEFAULT NULL COMMENT '变更前值',
    `after_value` JSON DEFAULT NULL COMMENT '变更后值',
    `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP 地址',
    `user_agent` VARCHAR(500) DEFAULT NULL COMMENT 'User Agent',
    `request_id` VARCHAR(100) DEFAULT NULL COMMENT '请求追踪 ID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_workspace_id` (`workspace_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_action` (`action`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `id` | 日志主键 |
| `workspace_id` | 关联的 Workspace ID |
| `user_id` | 执行操作的用户 ID |
| `action` | 操作类型，如 `workspace:create`、`member:add` |
| `target_type` | 目标资源类型，如 `workspace`、`workspace_member` |
| `target_id` | 目标资源 ID |
| `before_value` | 操作前的 JSON 数据 |
| `after_value` | 操作后的 JSON 数据 |
| `ip_address` | 用户 IP 地址（支持 IPv6） |
| `user_agent` | 浏览器/客户端 User Agent |
| `request_id` | 请求追踪 ID，用于关联日志链 |
| `created_at` | 操作时间 |

## API 设计

### 3.1 获取审计日志列表

**API 端点**:`GET /api/v1/workspaces/{workspace_id}/audit-logs`

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `action` | string | 按操作类型过滤 |
| `user_id` | int | 按操作用户过滤 |
| `start_date` | datetime | 开始时间 |
| `end_date` | datetime | 结束时间 |
| `page` | int | 页码，默认 1 |
| `page_size` | int | 每页数量，默认 20 |

**响应**:
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "total": 100,
    "items": [
      {
        "id": 1,
        "workspace_id": 1876543210,
        "user_id": 1234567890,
        "username": "admin",
        "action": "workspace:create",
        "target_type": "workspace",
        "target_id": 1876543210,
        "before_value": null,
        "after_value": {
          "name": "研发一部",
          "code": "yan-fa-yi-bu"
        },
        "ip_address": "192.168.1.100",
        "created_at": "2026-05-12T10:00:00Z"
      }
    ],
    "page": 1,
    "page_size": 20
  }
}
```

**权限**: 仅 `系统管理员` 和 `Workspace 所有者/管理员` 可访问

## 变更示例

### 创建 Workspace

```json
{
  "action": "workspace:create",
  "target_type": "workspace",
  "target_id": 1,
  "before_value": null,
  "after_value": {
    "name": "研发一部",
    "code": "yan-fa-yi-bu",
    "org_id": 10001,
    "owner_id": 1234567890
  }
}
```

### 更新 Workspace

```json
{
  "action": "workspace:update",
  "target_type": "workspace",
  "target_id": 1,
  "before_value": {
    "name": "研发一部"
  },
  "after_value": {
    "name": "研发二部"
  }
}
```

### 添加成员

```json
{
  "action": "member:add",
  "target_type": "workspace_member",
  "target_id": 2,
  "before_value": null,
  "after_value": {
    "user_id": 9876543210,
    "role": "member"
  }
}
```

### 角色变更

```json
{
  "action": "member:update",
  "target_type": "workspace_member",
  "target_id": 2,
  "before_value": {
    "role": "member"
  },
  "after_value": {
    "role": "admin"
  }
}
```

## 保留策略

| 环境 | 保留时间 | 说明 |
|------|----------|------|
| 生产环境 | 1 年 | 合规要求 |
| 测试环境 | 30 天 | 调试用 |

## 相关文档

- [ Workspace 产品设计 ](../../product/base/workspace设计)
- [ Workspace 技术设计 ](../admin/workspace技术设计)