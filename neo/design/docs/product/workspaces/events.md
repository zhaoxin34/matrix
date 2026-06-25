---
id: events
title: 事件管理
sidebar_position: 10
author: Joky.Zhao
created: 2026-06-25
updated: 2026-06-25
version: 1.0.0
tags: [workspace, event]
---

## 产品概述

事件描述谁在什么时间做了什么，是知识库的基础数据。

## 实体设计

| 字段名 | 类型/格式 | 说明 | 是否可编辑 |
| ------ | --------- | ---- | ---------- |
| id | BIGINT AUTO_INCREMENT | 主键，自增 id，唯一标识 | 否 |
| name | VARCHAR(255) | 事件名称，如 `lead.assigned` | 是 |
| entity_name | VARCHAR(255) | 关联实体（主语），格式 `{type}_{id}` | 是 |
| target_entity_name | VARCHAR(255) | 目标实体（宾语），如 `user_zhangsan` | 是 |
| actor | VARCHAR(255) | 触发者，如 `user_john` | 是 |
| timestamp | DATETIME | 事件发生时间 | 是 |
| page_url | VARCHAR(512) | 页面 URL（来源上下文） | 是 |
| session_id | VARCHAR(64) | 会话 ID | 是 |
| metadata | JSON | 扩展数据 | 是 |
| workspace_id | BIGINT | workspace 的 id | 否 |

## UI 设计

### 路由

| 页面 | 路由 | 说明 |
| ---- | ---- | ---- |
| events 列表页 | `/workspace/{workspace_code}/events` | 展示 events，包含过滤、分页 |
| 创建 event | `/workspace/{workspace_code}/events/new` | 创建新的 event |
| 修改 event | `/workspace/{workspace_code}/events/{id}/edit` | 修改 event |
| 查看 event 详情 | `/workspace/{workspace_code}/events/{id}` | 查看 event 详情 |

### 列表页过滤条件

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| name | 文本搜索 | 事件名称模糊搜索 |
| entity_name | 文本搜索 | 实体名称搜索 |
| actor | 文本搜索 | 触发者搜索 |
| timestamp | 日期范围 | 时间范围筛选 |

---

## 🔗 相关文档

- [事件技术设计](../../technical/workspaces/events) - API 设计、数据库设计
- [状态管理](./status) - 状态管理

---

## ✅ 设计检查清单

- [ ] 设计 UI 原型
