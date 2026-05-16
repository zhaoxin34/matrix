---
id: layout
title: Layout布局设计
sidebar_position: 30
author: Joky.Zhao
created: 2026-05-10
updated: 2026-05-16
version: 1.1.0
tags: [Layout]
---

[查看 UI 原型 →](http://localhost:3300/)

## 设计背景

Neo 产品是一个大型项目，包含多个功能模块（个人中心、工作区管理、系统管理等）。需要设计一个清晰的布局来组织这些功能。

## 设计思想

### 核心原则

1. **左右布局**：Sidebar 负责导航，Main Area 负责内容展示
2. **层级清晰**：导航结构扁平，避免深层嵌套
3. **状态隔离**：内容区通过 URL 参数（workspace_code）实现不同工作区的数据隔离

### 关键设计点

- **工作区切换**：放在 Header 区域，便于快速切换上下文
- **Sidebar**：固定菜单结构，分为「个人中心」「工作区」「系统管理」三大模块
- **内容区**：通过 URL 中的 `workspace_code` 参数，动态加载对应工作区的数据

## 页面结构

- 左侧: 从上到下
  - `sidebar header`: 图标+组织切换器
  - `sidebar content`：
    - 个人中心
    - 工作区
    - 系统管理
  - `sidebar foot`: avatar + 用户名 + profile等菜单
- 右侧: 从上到下
  - `main header`:
    - `worksapce switcher`
    - `breadcrumb navigation` 面包屑导航
  - `main content`

## Sidebar 设计

### 菜单结构

Sidebar 采用**固定菜单结构**，分为三大模块：

```
Sidebar
├── 个人中心
│   ├── 我的 Agents
│   ├── 我的任务
│   ├── ...
│   ├── ...
│   ├── ...
├── 工作区
│   ├── 嵌入网站管理
│   ├── Agent 管理
│   ├── ...
│   ├── ...
│   ├── ...
└── 系统管理
    ├── 组织管理
    ├── 用户管理
    ├── Agent 原型管理
    ├── ...
    ├── ...
    ├── ...
    ├── ...
```

### 菜单分组说明

| 分组     | 性质     | 说明                                     |
| -------- | -------- | ---------------------------------------- |
| 个人中心 | 用户私有 | 展示用户的个人数据（Agents、任务、录像） |
| 工作区   | 协作空间 | 管理工作区资源                           |
| 系统管理 | 组织级   | 管理员功能（组织、用户、系统配置）       |

## 相关文档

- [Sidebar Workspace 设计](./layout-sidebar-workspace) — Sidebar 中 Workspace 切换器的详细设计
- [嵌入网站产品设计](./workspaces/embedded-site) — embedded-site 模块详情
- [Agent 概述](./agents/agents-overview) — Agent 相关功能
