---
id: agent-steer-tech
title: Agent Steer 技术设计
sidebar_position: 32
author: Joky.Zhao
created: 2026-06-08
updated: 2026-06-08
version: 1.0.0
tags: [Agent, Steer, Technical, Chrome Extension]
---

## 1. 系统架构

### 1.1 整体架构

```mermaid
graph TB
    subgraph ChromeExtension["Chrome Extension"]
        A[Popup] -->|chrome.storage| B[Content Script]
        B -->|postMessage| C[iframe (Agent Steer)]
        B -->|录制| D[(IndexedDB)]
    end

    subgraph Workspace["Workspace (模拟环境)"]
        E[模拟目标页面] -->|postMessage| F[模拟 Content Script]
        F -->|postMessage| G[Agent Steer iframe]
    end
```

### 1.2 组件职责

| 组件 | 职责 | 运行环境 |
|------|------|----------|
| Popup | 配置管理 | Chrome Extension |
| Content Script | 底层执行 | Chrome Extension |
| Simulated CS | 模拟执行 | Workspace |
| Agent Steer | 交互 UI | iframe |

---

## 2. 消息协议

### 2.1 消息格式

所有组件间通信使用统一的消息格式：

```typescript
interface AgentMessage {
  type: MessageType;
  payload: Record<string, unknown>;
  timestamp: number;
  messageId: string;
  correlationId?: string;
}
```

### 2.2 消息类型

```typescript
// iframe → Content Script / Simulated CS (命令)
type CommandType =
  | 'START_RECORDING'    // 开始录制
  | 'STOP_RECORDING'     // 停止录制
  | 'PAUSE_RECORDING'    // 暂停录制
  | 'RESUME_RECORDING'   // 恢复录制
  | 'SET_MODE'           // 设置模式
  | 'EXECUTE_OPERATION'; // 执行操作

// Content Script / Simulated CS → iframe (事件)
type EventType =
  | 'STATE_UPDATE'        // 状态更新
  | 'RECORDING_EVENT'     // 录制事件
  | 'OPERATION_COMPLETED' // 操作完成
  | 'OPERATION_FAILED'    // 操作失败
  | 'CONFIG_UPDATED';     // 配置更新
```

### 2.3 消息示例

```typescript
// 设置模式
{
  type: 'SET_MODE',
  payload: { mode: 'learn' },
  timestamp: 1717852800000,
  messageId: 'msg_001'
}

// 状态更新
{
  type: 'STATE_UPDATE',
  payload: {
    mode: 'learn',
    isRecording: true,
    isPaused: false,
    duration: 15,
    events: 128
  },
  timestamp: 1717852815000,
  messageId: 'msg_002'
}
```

---

## 3. 模拟页面结构

### 3.1 目录结构

```
workspace/
└── src/
    └── pages/
        └── agent-steer/
            ├── index.tsx              # 主页面入口
            ├── components/
            │   ├── SimulatedPage.tsx    # 模拟目标页面容器
            │   ├── SimulatedCS.tsx      # 模拟 Content Script
            │   ├── AgentSteerFrame.tsx  # Agent Steer iframe 容器
            │   └── DebugPanel.tsx       # 调试面板
            ├── hooks/
            │   ├── useSimulatedCS.ts    # 模拟 CS hook
            │   └── useMessageLog.ts     # 消息日志 hook
            └── types/
                └── index.ts             # 共享类型定义
```

### 3.2 核心组件

#### SimulatedPage

模拟目标页面的容器，模拟用户操作的上下文环境。

```typescript
interface SimulatedPageProps {
  children: React.ReactNode;
  onUserAction?: (action: UserAction) => void;
}
```

#### SimulatedCS

模拟 Content Script 的行为，处理来自 Agent Steer 的命令。

```typescript
interface SimulatedCSState {
  mode: AgentMode;
  isRecording: boolean;
  isPaused: boolean;
  sessionId: string | null;
  events: RecordingEvent[];
}

function SimulatedCS() {
  // 状态管理
  // 消息处理
  // 录制逻辑
}
```

#### AgentSteerFrame

Agent Steer 的 iframe 容器，处理跨域通信。

```typescript
interface AgentSteerFrameProps {
  src: string;
  onMessage: (message: AgentMessage) => void;
  onReady: () => void;
}
```

#### DebugPanel

调试面板，用于开发时查看消息日志和状态。

```typescript
interface DebugPanelProps {
  messages: AgentMessage[];
  state: SimulatedCSState;
  onSimulateAction: (action: UserAction) => void;
}
```

---

## 4. 开发流程

### 4.1 开发阶段

```
┌─────────────────────────────────────────────────────────┐
│                    开发流程                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 接口设计                                            │
│     └── 定义消息类型、状态机                             │
│           ↓                                             │
│  2. 实现模拟页面                                        │
│     └── 在 workspace 下开发 Agent Steer                  │
│           ↓                                             │
│  3. 调试交互                                            │
│     └── 通过调试面板验证消息传递                         │
│           ↓                                             │
│  4. 集成测试                                            │
│     └── 接入 Chrome Extension，验证一致性                 │
│           ↓                                             │
│  5. 发布                                                │
│     └── 将 Agent Steer iframe 部署到 Neo 前端            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 调试工具

#### 消息日志面板

显示所有 postMessage 消息，包括：
- 发送/接收方向
- 消息类型
- 消息内容
- 时间戳

#### 状态监视器

实时显示 Simulated CS 的内部状态：
- 当前模式
- 录制状态
- 事件数量
- 会话 ID

#### 操作模拟器

手动触发用户操作：
- 模拟点击
- 模拟输入
- 模拟提交

---

## 5. 接口一致性

### 5.1 统一接口层

模拟环境和 Chrome Extension 使用相同的接口定义：

```typescript
// shared/types.ts
export enum MessageType {
  START_RECORDING = 'START_RECORDING',
  STOP_RECORDING = 'STOP_RECORDING',
  // ...
}

export interface AgentMessage {
  type: MessageType;
  payload: Record<string, unknown>;
  timestamp: number;
  messageId: string;
}
```

### 5.2 差异处理

| 方面 | Chrome Extension | 模拟环境 |
|------|-----------------|----------|
| 存储 | IndexedDB | localStorage / 内存 |
| 录制 | rrweb | 模拟事件 |
| 执行 | 真实 DOM 操作 | 日志记录 |
| 消息 | chrome.runtime | window.postMessage |

---

## 6. 相关文档

- [Agent Steer 产品设计](../../product/workspaces/agent-steer) - 产品意图和功能说明
- [Agent 嵌入技术设计](./agent-embedded) - Chrome Extension 整体架构