---
id: routing-table
title: 路由表-功能路由
author: Joky.Zhao
created: 2026-05-14
updated: 2026-05-14
version: 1.0.0
---

## 设计目标

集中管理产品功能路由，方便快速查找和跳转。

## 路由表

### 用户与认证

| 路由        | 功能       | 文档来源                       |
| ----------- | ---------- | ------------------------------ |
| `/login`    | 用户登录页 | [用户管理设计](./用户管理设计) |
| `/register` | 用户注册页 | [用户管理设计](./用户管理设计) |

### Workspace

| 路由                                 | 功能             | 文档来源                             |
| ------------------------------------ | ---------------- | ------------------------------------ |
| `/workspace`                         | Workspace 列表页 | [workspace产品设计](./workspace设计) |
| `/workspace/new`                     | 创建 Workspace   | [workspace产品设计](./workspace设计) |
| `/workspace/{workspace_id}`          | Workspace 详情页 | [workspace产品设计](./workspace设计) |
| `/workspace/{workspace_id}/settings` | Workspace 设置页 | [workspace产品设计](./workspace设计) |

### 超级管理员

| 路由                   | 功能                | 文档来源                       |
| ---------------------- | ------------------- | ------------------------------ |
| `/admin/users`         | 超级管理员-用户管理 | [用户管理设计](./用户管理设计) |
| `/admin/org-structure` | 组织架构管理        | [组织管理设计](./组织管理设计) |

## 路由清单汇总

| 路由                                 | 功能                | 分类      | 文档来源          |
| ------------------------------------ | ------------------- | --------- | ----------------- |
| `/login`                             | 用户登录页          | 用户认证  | 用户管理设计      |
| `/register`                          | 用户注册页          | 用户认证  | 用户管理设计      |
| `/workspace`                         | Workspace 列表页    | Workspace | workspace产品设计 |
| `/workspace/new`                     | 创建 Workspace      | Workspace | workspace产品设计 |
| `/workspace/{workspace_id}`          | Workspace 详情页    | Workspace | workspace产品设计 |
| `/workspace/{workspace_id}/settings` | Workspace 设置页    | Workspace | workspace产品设计 |
| `/admin/users`                       | 超级管理员-用户管理 | 管理后台  | 用户管理设计      |
| `/admin/org-structure`               | 组织架构管理        | 管理后台  | 组织管理设计      |

## 相关文档

- [UI 设计文档](../ui-design/index)
- [技术设计文档](../technical/index)
