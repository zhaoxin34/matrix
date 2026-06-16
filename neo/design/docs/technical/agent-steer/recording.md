---
id: recording
title: Recording 模块技术设计
sidebar_position: 33
author: Joky.Zhao
created: 2026-06-13
updated: 2026-06-16
version: 2.0.0
tags: [Agent, Steer, Recording, Chrome Extension]
---

## 1. 概述

Recording 模块在用户使用目标软件时，把操作过程录成可回放的录像。

一次录像由多个 **segment** 组成。Segment 在录制过程中被切分并**立即上传**到后端，浏览器侧不持久化录像数据。整个录像的元信息（`recordingUid`）存在 `chrome.storage.local` 里，仅用于浏览器重启后的恢复。

## 2. 核心概念

| 概念 | 含义 |
|------|------|
| **Recording** | 一次完整录制的 session。后端权威管理，浏览器不缓存其状态。 |
| **Segment** | 录像中的一段。由切分时机触发（10 分钟 / 暂停 / 切 tab / 不活跃 / 停止）。 |
| **recordingUid** | Recording 的身份标识。后端签发，浏览器存一份用于恢复。 |
| **segmentUid** | Segment 的身份标识。浏览器生成，上传时附上。 |
| **sequence** | Segment 在 recording 内的顺序。**后端自动分配**。 |

`name` 字段由浏览器侧按 `录制 YYYY-MM-DD HH:mm:ss` 生成，用户在 Neo 前端可改。

## 3. 设计原则

1. **后端是 session state 的权威**：recording 的所有元信息以后端为准，浏览器不缓存。
2. **零持久化**：浏览器侧不存 segment 数据。切 segment = 立即上传 + 清空。
3. **切 segment 是统一抽象**：所有切分时机都走同一个函数，差异只在"切完之后下一步做什么"。
4. **状态极少**：3 个 UI 状态，1 个跨重启的 session 标识。
5. **CS 直接调后端**：不走 SW 中转。

## 4. 角色与边界

```
┌────────────────────────────────────────────────┐
│ Popup        用户交互：开始 / 暂停 / 停止        │
└──────┬─────────────────────────────────────────┘
       │ 命令
       ▼
┌────────────────────────────────────────────────┐
│ Content Script (active tab)                    │
│   - rrweb 录制                                │
│   - 内存中的 segment buffer                    │
│   - 切 segment（统一流程）                       │
│   - 直接 fetch 后端                            │
│   - 监听 visibilitychange / chrome.idle       │
└──────┬─────────────────────────────────────────┘
       │ fetch
       ▼
┌────────────────────────────────────────────────┐
│ Backend      recording / segment 的 source of truth │
└────────────────────────────────────────────────┘

Service Worker：MV3 必需，但只做 Popup ↔ CS 消息的最薄路由。
chrome.storage.local：只存一个 recordingUid。
```

## 5. 数据归属

| 数据 | 归属 |
|------|------|
| recording、segment 元信息 | 后端（DB） |
| segment bytes | 后端（对象存储） |
| `recordingUid` | `chrome.storage.local` |
| 当前 segment 的 event buffer | CS 内存 |
| token / workspace 信息 | `chrome.storage.local`（已有） |

浏览器侧**不**持久化 segment。即使浏览器异常关闭，当前未上传的 segment 也只丢一次，重启后立刻接续下一个 segment。

## 6. 状态机

### 6.1 浏览器侧状态

三个状态：

```
       ┌────────────────────────────────────────┐
       │                                        │
       │   start                          stop  │
       │  ┌─────┐    pause    ┌───────┐         │
       │  │idle │ ─────────▶  │recording│ ───────┴──▶ idle
       │  └─────┘             └───────┘  ┌─────┐
       │     ▲                  │resume│ paused│
       │     │                  └──────┘────┘  │
       │     │         resume         ▲        │
       │     └───────────────────────┘        │
       └────────────────────────────────────────┘
```

- **idle**：未开始。
- **recording**：正在录制。后端 status = recording。
- **paused**：用户主动暂停。后端 status **不变**（仍是 recording）。

### 6.2 与后端 RecordingStatus 的关系

| 浏览器状态 | 后端 RecordingStatus |
|-----------|---------------------|
| idle | （无 recording）或 completed |
| recording | recording |
| paused | recording（用户视角暂停，后端不知道） |

`completed` 出现在用户主动停止后；`failed` 是异常路径，不展示给用户，由 CS 自行处理。

### 6.3 v2 中**没有**的状态

为避免实施时误把旧状态塞回来，明确不存在的状态：

- **pending**：浏览器不积累 segments，无需"已停止待上传"。
- **uploading**：切 segment = 立即上传完成，无"上传中"中间态。
- **success / error**：录制对用户透明，无"上传成功 / 失败" UI。

## 7. Segment 切分：统一的抽象

切 segment 是一个**统一的流程**，无论触发原因：

```
finishSegment():
    1. 停止 rrweb，序列化 buffer → events
    2. PUT  /recordings/{uid}/segments/{segmentUid}/bytes
    3. POST /recordings/{uid}/segments（注册元信息）
    4. 清空 buffer
```

"切完之后做什么"由触发时机决定，不属于 `finishSegment` 本身。

### 7.1 四个切分时机与后续动作

| 时机 | 后续动作 |
|------|----------|
| 10 分钟定时 | 启动新 segment，继续录制 |
| 用户暂停 | 停在 paused |
| 切 tab（旧 tab 切走） | 监听 visible → 启动新 segment |
| 浏览器不活跃 | 活跃时启动新 segment |
| **用户主动停止** | POST /complete，回到 idle |

> "切 segment"和"启动新 segment"是两个动作：切完旧的、再开新的。在 CS 里它们紧邻发生，但语义上要分清楚。

## 8. 生命周期

### 8.1 开始录制（idle → recording）

1. CS 调后端创建 recording，拿到 `recordingUid`。
2. 写入 `chrome.storage.local`。
3. 启动 rrweb、10 分钟定时器、`visibilitychange` 监听、`chrome.idle` 监听。
4. 状态 → recording。

### 8.2 录制中

按 §7 的切 segment 流程循环。

### 8.3 停止录制

1. 切最后一段 segment。
2. `POST /complete`。
3. 清除 `chrome.storage.local` 里的 `recordingUid`。
4. 状态 → idle。

### 8.4 浏览器重启续传

Popup 启动时读 `chrome.storage.local`：

- **存在 recordingUid** → 直接进入 recording 状态，CS 启动新 segment 接到原 recording 上。
- **不存在** → idle。

续传的 segment 会追加到原来的 recording 上，**不创建新 recording**。

## 9. 关键场景

### 9.1 跨 tab 切换

录制始终在 **active tab** 的 CS 里。

**旧 tab 切走**（`visibilitychange` 隐藏 / `chrome.tabs.onActivated` 别的 tab）：

1. 旧 tab CS 触发切 segment + 上传。
2. 旧 tab CS 进入"待续"：监听 `visibilitychange` 变 visible 就启动新 segment。

**新 tab 切来**：

1. 监听事件触发。
2. 读 `chrome.storage.local`：
   - 有 → 启动新 segment 接到原 recording。
   - 无 → 不动（保持 idle）。

> 双保险：`visibilitychange` 是主信号（页面级，最可靠），`chrome.tabs.onActivated` 处理新窗口等边角。

### 9.2 不活跃检测

- `chrome.idle.queryState(60)`：检测 60 秒无活动。
- 60 秒后：CS 触发切 segment（同 §7 流程）。
- 回到活跃：CS 启动新 segment。

长时间不活跃会产生多个"几乎空"的 segment。这是预期行为：保证不漏录、不堆积。

### 9.3 浏览器异常关闭

- 当前正在录制的 segment 数据**丢失**（只在内存）。
- 重启后 Popup 启动时检测到 `recordingUid`，立即开始新 segment。
- 录制整体不中断，丢失的只是最后一段的事件流。

## 10. 消息通道

- **命令**（Popup → CS）：`chrome.runtime.sendMessage`。
- **状态**（CS → Popup）：`chrome.runtime.sendMessage`（全局广播）。
- **SW**：MV3 必需占位，**不参与录制逻辑**。
- 消息用简单字符串 `type` 区分，不需要 requestId / direction / version 字段。

## 11. 文件结构

```
recording/
├── popup/          Popup UI（IdleView / RecordingView；paused 是 RecordingView 内部态）
├── cs/             Content Script（rrweb、segment 切分、API 调用）
├── sw/             SW 薄壳（消息路由占位）
├── session/        chrome.storage.local 读写
└── auth/           iframe bridge 拿 token
```

> 模块边界示意见 [Agent Steer 技术设计](./index.md)。

## 12. 不做的事

- ❌ 不持久化 segment。
- ❌ 不在 SW 协调上传。
- ❌ 不在浏览器侧做"上传进度"UI。
- ❌ 不在录制过程中让用户命名。
- ❌ 不做标注。
- ❌ 不做录制异常自动重试（失败由用户决定是否停止并重录）。

## 🔗 相关文档

- [软件操作录像与回放](../../product/agent-steer/recording) - 产品功能
- [Agent Steer 技术设计](./index.md) - 系统级架构
- [实施细节](./todo.md) - 接口、字段、消息类型、实施步骤
