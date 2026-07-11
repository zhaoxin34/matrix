---
id: status
title: 状态管理
sidebar_position: 11
author: Joky.Zhao
created: 2026-06-25
updated: 2026-06-25
version: 1.0.0
tags: [workspace, status]
---

## 产品概述

状态是实体的属性快照，通过 `entity_name` 和 `captured_at` 与事件关联。

## 实体设计

| 字段名 | 类型/格式 | 说明 | 是否可编辑 |
| ------ | --------- | ---- | ---------- |
| id | BIGINT AUTO_INCREMENT | 主键，自增 id，唯一标识 | 否 |
| entity_type | VARCHAR(128) | 实体类型，如 `lead`, `user` | 是 |
| entity_id | VARCHAR(255) | 实体 ID，业务系统的唯一标识 | 是 |
| attributes | JSON | 属性快照 | 是 |
| stat_at | DATETIME | 统计时间 | 是 |
| source | VARCHAR(128) | 来源，如 `crm_page_view` | 是 |
| session_id | VARCHAR(64) | 会话 ID | 是 |
| workspace_id | BIGINT | workspace 的 id | 否 |

## UI 设计

### 路由

| 页面 | 路由 | 说明 |
| ---- | ---- | ---- |
| status 列表页 | `/workspace/{workspace_code}/status` | 展示 status，包含过滤、分页 |
| 创建 status | `/workspace/{workspace_code}/status/new` | 创建新的 status |
| 修改 status | `/workspace/{workspace_code}/status/{id}/edit` | 修改 status |
| 查看 status 详情 | `/workspace/{workspace_code}/status/{id}` | 查看 status 详情 |

### 列表页过滤条件

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| entity_type | 下拉选择 | 实体类型筛选 |
| entity_id | 文本搜索 | 实体 ID 搜索 |
| stat_at | 日期范围 | 时间范围筛选 |
| source | 下拉选择 | 来源筛选 |

---

## 🔗 相关文档

- [状态技术设计](../../technical/workspaces/status) - API 设计、数据库设计
- [事件管理](./events) - 事件管理

---

## ✅ 设计检查清单

- [ ] 设计 UI 原型
