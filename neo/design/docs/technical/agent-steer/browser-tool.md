---
id: browser-tool-tech
title: browser-tool 技术设计
sidebar_position: 20
author: Joky.Zhao
created: 2026-06-08
updated: 2026-06-25
version: 1.0.0
tags: [Agent, Steer, Chrome Extension, Browser Tool]
---

# browser-tool 技术设计

> Chrome Extension 内容脚本中运行的内嵌 Agent 浏览器能力

---

## 背景

agent-steer 需要让 AI Agent 能够"感知"和"操作"用户正在浏览的页面。

现有 `agent-browser` CLI 用 CDP 协议隔空控制 Chrome，但 Extension 内容脚本直接运行在页面 JS 上下文中，不需要 CDP——元素就在手边。

`browser-tool` 就是把 DOM 自动化的策略逻辑抽出来，做成纯 Web API 库。

---

## 目标

1. **快照**：把页面 DOM 转换成 AI 友好的无障碍树（`id / role / name / value`）
2. **操作**：click / fill / type / press / hover / select 等原子操作
3. **等待**：等待元素出现、消失、条件满足

---

## 方案

```
Content Script
├── browser-tool (纯 Web API，无依赖)
│   ├── snapshot() → 获取页面快照
│   ├── click/fill/type/press... → 操作元素
│   └── waitForElement → 等待条件
│
└── bb-client (WebSocket 客户端)
    └── 把 browser-tool 操作指令发送到 agent-server
```

**关键设计**：

- 零运行时依赖，不引入任何框架
- 用 Shadow DOM 隔离，不污染目标页面样式
- 每个元素分配稳定 ID（`e1`, `e2`...），跨 snapshot 可能变化

---

## 功能列表

### 快照

| API | 说明 |
|-----|------|
| `snapshot(root?)` | 获取页面 accessibility 树，返回扁平节点列表 |

### 元素查找

| API | 说明 |
|-----|------|
| `resetElementMap()` | 清空 ID→元素映射 |
| `getElementById(id)` | 通过 ID 查找元素 |

### 鼠标操作

| API | 说明 |
|-----|------|
| `click(target)` | 单击 |
| `dblclick(target)` | 双击 |
| `hover(target)` | 悬停 |
| `drag(source, target)` | 拖拽 |

### 键盘操作

| API | 说明 |
|-----|------|
| `type(target, text)` | 输入文本（逐字） |
| `press(key)` | 按键（如 Enter、Tab、Escape） |

### 表单操作

| API | 说明 |
|-----|------|
| `fill(target, value)` | 填充表单（React 兼容） |
| `check(target)` | 勾选复选框 |
| `uncheck(target)` | 取消勾选 |
| `select(target, ...values)` | 选择下拉项 |

### 滚动

| API | 说明 |
|-----|------|
| `scroll(dir, px?)` | 页面滚动 |
| `scrollIntoView(target)` | 滚动元素到可视区 |

### 等待

| API | 说明 |
|-----|------|
| `waitForElement(target, opts?)` | 等待元素出现/消失 |
| `waitForSelector(root, sel, opts?)` | 等待 CSS 选择器匹配 |
| `waitForText(text, opts?)` | 等待文本出现 |

---

## Target 格式

所有操作支持多种目标指定方式：

```ts
// CSS 选择器
click('button#submit')

// ID 引用（来自 snapshot）
click('e3')

// 直接传 Element
click(buttonElement)

// 懒函数
click(() => document.querySelector('.dynamic'))
```

---

## 与 agent-steer 的集成点

```
用户浏览页面
    ↓ 录制操作
content_script
    ├── browser-tool.snapshot() → 获取页面状态
    │       ↓
    │   AI 理解页面结构
    │
    ├── AI 决定操作 → browser-tool.click('e5')
    │       ↓
    │   操作目标元素
    │
    └── 结果返回 AI
```

**配置项**：

- agent-server WebSocket 地址：`ws://{agent-server-url}/api/ws/bb-router`
- Session ID：从 chrome.storage.session 获取

---

## 限制

- ❌ 不支持跨域 iframe（浏览器安全边界）
- ❌ HTML5 原生拖拽（走 mouse events 模拟）
- ❌ 不做网络拦截、cookie 操作
