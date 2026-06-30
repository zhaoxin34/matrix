---
id: routing-table
title: 路由表及原型文档对应关系
sidebar_position: 40
author: Joky.Zhao
created: 2026-05-14
updated: 2026-06-30
version: 1.6.0
---

## 变更历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.6.0 | 2026-06-30 | 新增 knlg-base（知识库与问答库）相关路由（首页、问答库、知识库、规则库、知识导入、AI 访谈、设置） |
| 1.5.0 | 2026-06-28 | 新增 Interceptor 相关路由（列表页、详情页、创建页、编辑页） |
| 1.4.0 | 2026-06-25 | 新增 Event 和 Status 相关路由（列表页、详情页、创建页、编辑页） |
| 1.3.0 | 2026-06-10 | 新增 Recording 相关路由（列表页、详情页、回放页） |
| 1.2.0 | 2026-06-09 | 新增「我的任务列表页」路由 `/me/tasks` |
| 1.1.0 | 2026-06-08 | 初始版本 |

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
| Agent 列表页         | Workspace | [`/workspace/{workspace_code}/agents`](http://localhost:3000/workspace/1/agents)   | [`/ui/app/workspace/[workspace_code]/agents/page.tsx`](http://localhost:3300/workspace/1/agents)                                                                                         | [Agent Factory 设计](./agent-factory)      |
| Agent 详情页         | Workspace | [`/workspace/{workspace_code}/agents/{id}`](http://localhost:3000/workspace/1/agents/1) | [`/ui/app/workspace/[workspace_code]/agents/[id]/page.tsx`](http://localhost:3300/workspace/1/agents/1)                                                                                      | [Agent Factory 设计](./agent-factory)      |
| Agent 创建页        | Workspace | [`/workspace/{workspace_code}/agents/create`](http://localhost:3000/workspace/1/agents/create) | [`/ui/app/workspace/[workspace_code]/agents/create/page.tsx`](http://localhost:3300/workspace/1/agents/create)                                                                          | [Agent Factory 设计](./agent-factory)      |
| Agent 编辑页        | Workspace | [`/workspace/{workspace_code}/agents/{id}/edit`](http://localhost:3000/workspace/1/agents/1/edit) | [`/ui/app/workspace/[workspace_code]/agents/[id]/edit/page.tsx`](http://localhost:3300/workspace/1/agents/1/edit)                                                                        | [Agent Factory 设计](./agent-factory)      |
| Agent Steer 模拟页  | Workspace | [`/workspace/{workspace_code}/agent-steer`](http://localhost:3000/workspace/1/agent-steer) | -                                                                                                             | [Agent Steer 产品设计](../agent-steer/) |
| Skills 列表页        | 管理后台  | [`/admin/skills`](http://localhost:3000/admin/skills)                                        | [`/ui/app/admin/skills/page.tsx`](http://localhost:3300/admin/skills)                                         | [Skills 功能概述](./admin/skills-overview) |
| Skill 详情页        | 管理后台  | [`/skills/{code}`](http://localhost:3000/skills/my-first-skill)                               | -                                                                                                             | [Skills 功能概述](./admin/skills-overview) |
| EmbeddedSite 列表页 | Workspace | [`/workspace/{workspace_code}/embedded-sites`](http://localhost:3000/workspace/1/embedded-sites) | [`/ui/app/workspace/[workspace_code]/embedded-site/list/page.tsx`](http://localhost:3300/workspace/1/embedded-sites) | [嵌入网站管理](../../product/workspaces/embedded-site) |
| 创建 EmbeddedSite  | Workspace | [`/workspace/{workspace_code}/embedded-sites/new`](http://localhost:3000/workspace/1/embedded-sites/new) | [`/ui/app/workspace/[workspace_code]/embedded-site/new/page.tsx`](http://localhost:3300/workspace/1/embedded-sites/new) | [嵌入网站管理](../../product/workspaces/embedded-site) |
| 编辑 EmbeddedSite  | Workspace | [`/workspace/{workspace_code}/embedded-sites/{id}/edit`](http://localhost:3000/workspace/1/embedded-sites/1/edit) | [`/ui/app/workspace/[workspace_code]/embedded-site/[id]/edit/page.tsx`](http://localhost:3300/workspace/1/embedded-sites/1/edit) | [嵌入网站管理](../../product/workspaces/embedded-site) |
| 我的任务列表页   | 个人中心 | [`/me/tasks`](http://localhost:3000/me/tasks) | - | [Agent 任务管理](./workspaces/agent-task-manager) |
| Agent 任务列表页   | Workspace | [`/workspace/{workspace_code}/tasks`](http://localhost:3000/workspace/1/tasks) | - | [Agent 任务管理](./workspaces/agent-task-manager) |
| Agent 任务详情页   | Workspace | [`/workspace/{workspace_code}/tasks/{task_id}`](http://localhost:3000/workspace/1/tasks/1) | - | [Agent 任务管理](./workspaces/agent-task-manager) |
| Agent 执行记录详情页 | Workspace | [`/workspace/{workspace_code}/tasks/{task_id}/records/{record_id}`](http://localhost:3000/workspace/1/tasks/1/records/1) | - | [Agent 任务管理](./workspaces/agent-task-manager) |
| Recording 列表页 | Workspace | [`/workspace/{workspace_code}/recordings`](http://localhost:3000/workspace/1/recordings) | - | [Recording 产品设计](./workspaces/recording) |
| Recording 详情页 | Workspace | [`/workspace/{workspace_code}/recordings/{uid}`](http://localhost:3000/workspace/1/recordings/rec-abc123) | - | [Recording 产品设计](./workspaces/recording) |
| Recording 回放页 | Workspace | [`/workspace/{workspace_code}/recordings/{uid}/play`](http://localhost:3000/workspace/1/recordings/rec-abc123/play) | - | [Recording 产品设计](./workspaces/recording) |
| Event 列表页 | Workspace | [`/workspace/{workspace_code}/events`](http://localhost:3000/workspace/1/events) | - | [事件管理](./workspaces/events) |
| Event 详情页 | Workspace | [`/workspace/{workspace_code}/events/{id}`](http://localhost:3000/workspace/1/events/1) | - | [事件管理](./workspaces/events) |
| Event 创建页 | Workspace | [`/workspace/{workspace_code}/events/new`](http://localhost:3000/workspace/1/events/new) | - | [事件管理](./workspaces/events) |
| Event 编辑页 | Workspace | [`/workspace/{workspace_code}/events/{id}/edit`](http://localhost:3000/workspace/1/events/1/edit) | - | [事件管理](./workspaces/events) |
| Status 列表页 | Workspace | [`/workspace/{workspace_code}/status`](http://localhost:3000/workspace/1/status) | - | [状态管理](./workspaces/status) |
| Status 详情页 | Workspace | [`/workspace/{workspace_code}/status/{id}`](http://localhost:3000/workspace/1/status/1) | - | [状态管理](./workspaces/status) |
| Status 创建页 | Workspace | [`/workspace/{workspace_code}/status/new`](http://localhost:3000/workspace/1/status/new) | - | [状态管理](./workspaces/status) |
| Status 编辑页 | Workspace | [`/workspace/{workspace_code}/status/{id}/edit`](http://localhost:3000/workspace/1/status/1/edit) | - | [状态管理](./workspaces/status) |
| Interceptor 列表页 | Workspace | [`/workspace/{workspace_code}/interceptors`](http://localhost:3000/workspace/1/interceptors) | - | [拦截器管理](./workspaces/interceptor) |
| Interceptor 详情页 | Workspace | [`/workspace/{workspace_code}/interceptors/{id}`](http://localhost:3000/workspace/1/interceptors/1) | - | [拦截器管理](./workspaces/interceptor) |
| Interceptor 创建页 | Workspace | [`/workspace/{workspace_code}/interceptors/new`](http://localhost:3000/workspace/1/interceptors/new) | - | [拦截器管理](./workspaces/interceptor) |
| Interceptor 编辑页 | Workspace | [`/workspace/{workspace_code}/interceptors/{id}/edit`](http://localhost:3000/workspace/1/interceptors/1/edit) | - | [拦截器管理](./workspaces/interceptor) |
| 知识库首页 | Workspace | [`/workspace/{workspace_code}/knlg-base`](http://localhost:3000/workspace/1/knlg-base) | - | [知识库与问答库产品设计](./knlg-base/) |
| 问答库列表页 | Workspace | [`/workspace/{workspace_code}/knlg-base/qa`](http://localhost:3000/workspace/1/knlg-base/qa) | - | [问答库产品设计](./knlg-base/q-a-library) |
| 问题详情页 | Workspace | [`/workspace/{workspace_code}/knlg-base/qa/questions/{id}`](http://localhost:3000/workspace/1/knlg-base/qa/questions/1) | - | [问答库产品设计](./knlg-base/q-a-library) |
| 访谈详情页 | Workspace | [`/workspace/{workspace_code}/knlg-base/qa/interviews/{id}`](http://localhost:3000/workspace/1/knlg-base/qa/interviews/1) | - | [问答库产品设计](./knlg-base/q-a-library) |
| 新建访谈会话页 | Workspace | [`/workspace/{workspace_code}/knlg-base/qa/sessions/new`](http://localhost:3000/workspace/1/knlg-base/qa/sessions/new) | - | [问答库产品设计](./knlg-base/q-a-library) |
| 问题树模板管理页 | Workspace | [`/workspace/{workspace_code}/knlg-base/qa/templates`](http://localhost:3000/workspace/1/knlg-base/qa/templates) | - | [问答库产品设计](./knlg-base/q-a-library) |
| 知识卡片列表页 | Workspace | [`/workspace/{workspace_code}/knlg-base/knowledge`](http://localhost:3000/workspace/1/knlg-base/knowledge) | - | [知识库与规则库设计](./knlg-base/knowledge-and-rule) |
| 新建知识卡片页 | Workspace | [`/workspace/{workspace_code}/knlg-base/knowledge/cards/new`](http://localhost:3000/workspace/1/knlg-base/knowledge/cards/new) | - | [知识库与规则库设计](./knlg-base/knowledge-and-rule) |
| 知识卡片详情页 | Workspace | [`/workspace/{workspace_code}/knlg-base/knowledge/cards/{id}`](http://localhost:3000/workspace/1/knlg-base/knowledge/cards/1) | - | [知识库与规则库设计](./knlg-base/knowledge-and-rule) |
| 知识卡片编辑页 | Workspace | [`/workspace/{workspace_code}/knlg-base/knowledge/cards/{id}/edit`](http://localhost:3000/workspace/1/knlg-base/knowledge/cards/1/edit) | - | [知识库与规则库设计](./knlg-base/knowledge-and-rule) |
| 知识卡片版本对比页 | Workspace | [`/workspace/{workspace_code}/knlg-base/knowledge/cards/{id}/versions`](http://localhost:3000/workspace/1/knlg-base/knowledge/cards/1/versions) | - | [知识库与规则库设计](./knlg-base/knowledge-and-rule) |
| 候选知识审核页 | Workspace | [`/workspace/{workspace_code}/knlg-base/knowledge/candidates`](http://localhost:3000/workspace/1/knlg-base/knowledge/candidates) | - | [知识导入模块设计](./knlg-base/knowledge-import) |
| 规则库列表页 | Workspace | [`/workspace/{workspace_code}/knlg-base/rules`](http://localhost:3000/workspace/1/knlg-base/rules) | - | [知识库与规则库设计](./knlg-base/knowledge-and-rule) |
| 新建规则页 | Workspace | [`/workspace/{workspace_code}/knlg-base/rules/rules/new`](http://localhost:3000/workspace/1/knlg-base/rules/rules/new) | - | [知识库与规则库设计](./knlg-base/knowledge-and-rule) |
| 规则详情页 | Workspace | [`/workspace/{workspace_code}/knlg-base/rules/rules/{id}`](http://localhost:3000/workspace/1/knlg-base/rules/rules/1) | - | [知识库与规则库设计](./knlg-base/knowledge-and-rule) |
| 规则编辑页 | Workspace | [`/workspace/{workspace_code}/knlg-base/rules/rules/{id}/edit`](http://localhost:3000/workspace/1/knlg-base/rules/rules/1/edit) | - | [知识库与规则库设计](./knlg-base/knowledge-and-rule) |
| 规则健康度页 | Workspace | [`/workspace/{workspace_code}/knlg-base/rules/rules/{id}/health`](http://localhost:3000/workspace/1/knlg-base/rules/rules/1/health) | - | [知识库与规则库设计](./knlg-base/knowledge-and-rule) |
| 知识导入首页 | Workspace | [`/workspace/{workspace_code}/knlg-base/import`](http://localhost:3000/workspace/1/knlg-base/import) | - | [知识导入模块设计](./knlg-base/knowledge-import) |
| 上传文档页 | Workspace | [`/workspace/{workspace_code}/knlg-base/import/upload`](http://localhost:3000/workspace/1/knlg-base/import/upload) | - | [知识导入模块设计](./knlg-base/knowledge-import) |
| 导入任务详情页 | Workspace | [`/workspace/{workspace_code}/knlg-base/import/jobs/{id}`](http://localhost:3000/workspace/1/knlg-base/import/jobs/1) | - | [知识导入模块设计](./knlg-base/knowledge-import) |
| AI 访谈实时交互页 | Workspace | [`/workspace/{workspace_code}/knlg-base/interview/sessions/{id}`](http://localhost:3000/workspace/1/knlg-base/interview/sessions/1) | - | [知识萃取流程设计](./knlg-base/extraction-flow) |
| 历史访谈查看页 | Workspace | [`/workspace/{workspace_code}/knlg-base/interview/sessions/{id}/history`](http://localhost:3000/workspace/1/knlg-base/interview/sessions/1/history) | - | [知识萃取流程设计](./knlg-base/extraction-flow) |
| Prompt 模板管理页 | Workspace | [`/workspace/{workspace_code}/knlg-base/settings/prompts`](http://localhost:3000/workspace/1/knlg-base/settings/prompts) | - | [知识库与问答库技术设计](../../technical/knlg-base/) |
| LLM Provider 管理页 | Workspace | [`/workspace/{workspace_code}/knlg-base/settings/llm`](http://localhost:3000/workspace/1/knlg-base/settings/llm) | - | [知识库与问答库技术设计](../../technical/knlg-base/) |

## 相关文档

- [UI 设计文档](../ui-design/index)
- [技术设计文档](../technical/index)
