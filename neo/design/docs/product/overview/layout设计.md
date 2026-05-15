---
id: layout
title: layout设计
author: Joky.Zhao
created: 2026-05-10
updated: 2026-05-10
version: 1.0.0
tags: [Agent]
---

[查看 UI 原型 →](http://localhost:3300/)

## 设计背景

Neo 产品是一个大型项目，包含了很多菜单和功能，必须设计一个良好的布局，容纳这些菜单和功能。

## 设计思想

我们先找到Neo需要管理的实体，实体比如是组织、部门、员工、用户、Agent、skills、录像、issue、任务、workspace等等。这些实体有从属关系，导致我们可以从不同的维度去管理他们。

**核心归属规则**：

- Agent 必须同时属于某个 **workspace** 和 **用户**
- workspace 必须属于某个 **组织**

**视图呈现说明**：

- 在「我的 Agents」下：按 `user_id` 过滤，显示该用户所有 Agent
- 在 workspace 下：按 `workspace_id` 过滤，显示该 workspace 下所有 Agent
- 两处看到的是相同的 Agent 集合，只是过滤条件不同他的菜单如下所示，

- Matrix公司-北京部门
  - 个人中心
    - 我的Agents
  - Crm工作区
    - Agents
  - 系统管理
    - Agents

## 布局方式

采用左右布局，左侧sidebar，右侧是main区

### sidebar 布局设计

#### sidebar header

- logo展示
- 组织切换

#### sidebar content

- 个人中心
  - 子功能1
  - 子功能2
- 工作区
  - 子功能1
  - 子功能2
- 系统管理
  - 子功能1
  - 子功能2

#### sidebar footer

- Avatar
- username
- logout
- profile

### main 区设计

暂不考虑

---

## 🔗 相关文档

- [ Agents 设计 ](./agents/agents-overview)
- [ Agent 嵌入 ](./agents/agent-ingest)
