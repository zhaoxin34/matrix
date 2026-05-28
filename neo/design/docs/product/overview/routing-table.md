---
id: routing-table
title: 路由表及原型文档对应关系
sidebar_position: 40
author: Joky.Zhao
created: 2026-05-14
updated: 2026-05-14
version: 1.0.0
---

## 设计目标

集中管理产品功能路由，方便快速查找和跳转。

## 路由清单

| 功能                | 分类      | 路由 & 访问地址                                                                      | UI 原型                                                                                                       | 文档来源                                   |
| ------------------- | --------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 用户登录页          | 用户认证  | [`/login`](http://localhost:3000/login)                                              | [`/ui/app/login/page.tsx`](http://localhost:3000/login)                                                       | [用户管理设计](./用户管理设计)             |
| 用户注册页          | 用户认证  | [`/register`](http://localhost:3000/register)                                        | [`/ui/app/register/page.tsx`](http://localhost:3000/register)                                                 | [用户管理设计](./用户管理设计)             |
| Workspace 列表页    | Workspace | [`/admin/workspace`](http://localhost:3000/admin/workspace)                          | [`/ui/app/admin/workspace/page.tsx`](http://localhost:3000/admin/workspace)                                   | [workspace产品设计](./workspace设计)       |
| 创建 Workspace      | Workspace | [`/admin/workspace/new`](http://localhost:3000/admin/workspace/new)                  | [`/ui/app/admin/workspace/new/page.tsx`](http://localhost:3000/admin/workspace/new)                           | [workspace产品设计](./workspace设计)       |
| Workspace 设置页    | Workspace | [`/admin/workspace/{id}/settings`](http://localhost:3000/admin/workspace/1/settings) | [`/ui/app/admin/workspace/[workspaceId]/settings/page.tsx`](http://localhost:3000/admin/workspace/1/settings) | [workspace产品设计](./workspace设计)       |
| 超级管理员-用户管理 | 管理后台  | [`/admin/users`](http://localhost:3000/admin/users)                                  | [`/ui/app/admin/users/page.tsx`](http://localhost:3000/admin/users)                                           | [用户管理设计](./用户管理设计)             |
| 组织架构管理        | 管理后台  | [`/admin/org-structure`](http://localhost:3000/admin/org-structure)                  | [`/ui/app/admin/org-structure/page.tsx`](http://localhost:3000/admin/org-structure)                           | [组织管理设计](./admin/org-management)     |
| Agent Prototype 列表 | 管理后台  | [`/admin/agent-prototype`](http://localhost:3000/admin/agent-prototype)                | -                                                                                                             | [Agent Prototype 管理设计](./admin/agent-prototype-management) |
| Agent Prototype 详情 | 管理后台  | [`/admin/agent-prototype/{id}`](http://localhost:3000/admin/agent-prototype/1)        | -                                                                                                             | [Agent Prototype 管理设计](./admin/agent-prototype-management) |
| Agent Prototype 编辑 | 管理后台  | [`/admin/agent-prototype/{id}/edit`](http://localhost:3000/admin/agent-prototype/1/edit) | -                                                                                                       | [Agent Prototype 管理设计](./admin/agent-prototype-management) |
| 我的 Workspace      | Workspace | [`/workspace`](http://localhost:3000/workspace)                                      | -                                                                                                             | [workspace产品设计](./workspace设计)       |
| Workspace 详情页    | Workspace | [`/workspace/{id}`](http://localhost:3000/workspace/1)                               | -                                                                                                             | [workspace产品设计](./workspace设计)       |
| Agent 列表页         | Workspace | [`/workspace/{workspace_code}/agents`](http://localhost:3000/workspace/1/agents)   | -                                                                                                             | [Agent Factory 设计](./agent-factory)      |
| Agent 详情页         | Workspace | [`/workspace/{workspace_code}/agents/{id}`](http://localhost:3000/workspace/1/agents/1) | -                                                                                                        | [Agent Factory 设计](./agent-factory)      |
| Agent 创建页        | Workspace | [`/workspace/{workspace_code}/agents/create`](http://localhost:3000/workspace/1/agents/create) | -                                                                                                    | [Agent Factory 设计](./agent-factory)      |
| Agent 编辑页        | Workspace | [`/workspace/{workspace_code}/agents/{id}/edit`](http://localhost:3000/workspace/1/agents/1/edit) | -                                                                                              | [Agent Factory 设计](./agent-factory)      |
| Skills 列表页        | 管理后台  | [`/admin/skills`](http://localhost:3000/admin/skills)                                        | [`/ui/app/admin/skills/page.tsx`](http://localhost:3000/admin/skills)                                         | [Skills 功能概述](./admin/skills-overview) |
| Skill 详情页        | 管理后台  | [`/skills/{code}`](http://localhost:3000/skills/my-first-skill)                               | -                                                                                                             | [Skills 功能概述](./admin/skills-overview) |

## 相关文档

- [UI 设计文档](../ui-design/index)
- [技术设计文档](../technical/index)
