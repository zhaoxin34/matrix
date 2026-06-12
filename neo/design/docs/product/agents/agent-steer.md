---
id: agent-steer
title: Agent Steer 产品设计
sidebar_position: 20
author: Joky.Zhao
created: 2026-06-08
updated: 2026-06-08
version: 1.0.0
tags: [Agent, Steer, Chrome Extension]
---

## 🎯 产品概述

### 什么是 Agent Steer

**Agent Steer**（智能体操控台）是 Chrome 扩展中嵌入的 iframe UI，用于与 Content Script 通信、控制 Agent 行为、显示录制状态。

它的名字来源于"驾驶舱（Steer/Cockpit）"的隐喻——用户坐在驾驶座上，操控和观察 Agent 的行为，就像飞行员操控飞机一样。

### 为什么需要 Agent Steer

在 Chrome Extension 架构中，存在多个组件：
- **Popup**：Extension 弹出窗口，用于配置管理
- **Content Script**：注入到目标页面的脚本，负责底层执行
- **Service Worker**：后台服务，负责消息路由

Popup 负责配置（前端地址、后端地址、功能开关），但不应该承担复杂的交互逻辑。而 Content Script 只能执行底层操作，无法直接与用户交互。

因此需要一个 **中间层 UI** 来：
1. 控制录制（开始/暂停/停止）
2. 显示实时状态（录制时长、事件计数）
3. 播放回放（rrweb 回放）

这个中间层就是 **Agent Steer**。

---

## 📖 名词解释

### Agent Steer

> **定义**：嵌入到目标页面的UI组件，作为用户与 Content Script 之间的交互桥梁。

**核心职责**：
- 录制控制（开始/暂停/停止）
- 状态显示（实时反馈）
- 回放控制（rrweb player）

**不在 Agent Steer 职责范围内**：
- 配置管理（由 Popup 负责）
- 底层执行（由 Content Script 负责）
- 数据持久化（由 IndexedDB 负责）

---

## 📱 UI 设计

### 页面路由

| 页面 | 路由 | 说明 |
|------|------|------|
| Agent Steer 模拟 | `/workspace/{code}/agent-steer` | 主页面 |

---

## 🔗 相关文档

- [Agent Steer 技术设计](../../technical/agents/agent-steer) - 架构设计、接口协议、模拟页面结构
- [Agent 概述](../agents/agents) - Agent 功能概述

---

## ✅ 设计检查清单

- [x] 定义清晰的产品边界
- [x] 定义名词解释
- [x] 定义功能范围
- [x] 设计 UI 界面
- [ ] 定义 UI 原型位置
- [ ] 定义权限矩阵