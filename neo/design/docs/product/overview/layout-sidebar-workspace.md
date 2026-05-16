---
id: layout-sidebar-workspace
title: Sidebar Workspace设计
sidebar_position: 31
author: Joky.Zhao
created: 2026-05-16
updated: 2026-05-16
version: 1.0.0
tags: [Layout]
---

> 本文档是 [Layout 布局设计](./layout设计) 的子文档，专注于 Sidebar 中 **Workspace 切换器和菜单** 的详细设计。

## 设计目标

Workspace 是组织下的一个虚拟空间，用于隔离不同业务的数据和配置。Sidebar 需要支持：

1. **快速切换**当前工作的 Workspace
2. **统一展示**该 Workspace 下的所有功能菜单
3. **上下文隔离**：列表页内容随 Workspace 不同而变化
