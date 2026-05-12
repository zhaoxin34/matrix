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

我们先找到Neo需要管理的实体，实体比如是是组织、部门、员工、用户、Agent、skills、录像、issue、任务、workspace等等。这些实体有从属关系，导致我们可以从不同的维度去管理他们，比如，Agent属于某个workspace，workspace也必须属于某个组织和部门，Agent也必然属于某个员工，所以管理Agent可以在workspace里，也可以在这个员工的个人菜单下。他的菜单如下所示，

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
