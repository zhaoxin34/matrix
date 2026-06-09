---
id: agent-steer-ui-design
title: Agent Steer UI 设计方案
sidebar_position: 21
author: Claude
created: 2026-06-09
updated: 2026-06-09
version: 1.0.0
tags: [Agent, Steer, UI]
---

> 基于产品设计文档和技术设计文档

---

## 1. 页面路由

根据技术设计，Agent Steer UI 模拟页面路由：

```
/workspace/{workspace_code}/agent-steer
```

**文件位置**：
```
frontend/app/(main)/workspace/[workspace_code]/agent-steer/
├── page.tsx                    # 主页面入口
├── components/
│   ├── AgentSteer.tsx           # Agent Steer 主组件
│   ├── ModeSelector.tsx         # 模式选择器
│   ├── RecordingControls.tsx    # 录制控制
│   ├── StatusDisplay.tsx        # 状态显示
│   ├── PlaybackControls.tsx     # 回放控制
│   ├── SimulatedPage.tsx        # 模拟目标页面容器
│   ├── SimulatedCS.tsx          # 模拟 Content Script
│   └── DebugPanel.tsx           # 调试面板（可选）
├── hooks/
│   ├── useAgentSteer.ts         # Agent Steer 状态管理
│   ├── useSimulatedCS.ts        # 模拟 Content Script
│   └── useMessageLog.ts         # 消息日志
└── types/
    └── index.ts                 # 类型定义
```

---

## 2. UI 布局结构

### 2.1 整体布局

```
┌─────────────────────────────────────────────────────────────────┐
│  🔧 Agent Steer                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  模拟目标页面容器 (SimulatedPage)                         │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │                                                     │ │   │
│  │  │           目标页面内容                               │ │   │
│  │  │                                                     │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │  Agent Steer iframe 容器                           │ │   │
│  │  │  ┌───────────────────────────────────────────────┐  │ │   │
│  │  │  │  🔧 Agent Steer                              │  │ │   │
│  │  │  ├───────────────────────────────────────────────┤  │ │   │
│  │  │  │                                               │  │ │   │
│  │  │  │  [模式选择] [学习] [指导] [主动]              │  │ │   │
│  │  │  │                                               │  │ │   │
│  │  │  │  [录制控制区域]                               │  │ │   │
│  │  │  │  ● 00:15:32              ⏸ ⏹                 │  │ │   │
│  │  │  │  事件: 128                                     │  │ │   │
│  │  │  │                                               │  │ │   │
│  │  │  │  [回放控制区域]（指导模式）                    │  │ │   │
│  │  │  │                                               │  │ │   │
│  │  │  └───────────────────────────────────────────────┘  │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  调试面板 (DebugPanel) - 可折叠                          │   │
│  │  - 消息日志                                              │   │
│  │  - 状态监视器                                             │   │
│  │  - 操作模拟器                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Agent Steer 主面板布局

```
┌───────────────────────────────────────┐
│  🔧 Agent Steer                       │
├───────────────────────────────────────┤
│                                       │
│  [模式选择区域]                         │
│  ┌─────────┐ ┌─────────┐ ┌───────┐   │
│  │  学习   │ │  指导   │ │ 主动  │   │
│  │  Learn  │ │  Guide  │ │Active │   │
│  └─────────┘ └─────────┘ └───────┘   │
│                                       │
│  ───────────────────────────────────  │
│                                       │
│  [录制/回放控制区域]                    │
│                                       │
│  学习模式:                             │
│  ┌─────────────────────────────────┐   │
│  │  🎬 学习模式                     │   │
│  │  ● 00:15:32          ⏸  ⏹     │   │
│  │  事件: 128                       │   │
│  └─────────────────────────────────┘   │
│                                       │
│  指导模式:                             │
│  ┌─────────────────────────────────┐   │
│  │  🎥 指导模式                     │   │
│  │  ┌───────────────────────────┐  │   │
│  │  │   rrweb Player           │  │   │
│  │  │   ▶ 00:05:32 / 00:10:00  │  │   │
│  │  └───────────────────────────┘  │   │
│  │  ════════════●══════════════   │   │
│  │  操作: 点击了「提交」按钮        │   │
│  └─────────────────────────────────┘   │
│                                       │
└───────────────────────────────────────┘
```

---

## 3. 组件设计

### 3.1 AgentSteer (主容器)

```typescript
interface AgentSteerProps {
  className?: string;
}

// 状态结构
interface AgentSteerState {
  mode: 'learn' | 'guide' | 'active';
  recordingState: 'idle' | 'recording' | 'paused' | 'playing';
  duration: number;        // 秒
  eventCount: number;
  playbackProgress?: number;
}
```

### 3.2 ModeSelector (模式选择器)

```typescript
interface ModeSelectorProps {
  value: 'learn' | 'guide' | 'active';
  onChange: (mode: 'learn' | 'guide' | 'active') => void;
}

// 按钮样式
// - 默认: outline 样式
// - 选中: default 样式 + 左侧高亮条
// - Hover: ghost 样式
```

### 3.3 RecordingControls (录制控制)

```typescript
interface RecordingControlsProps {
  recordingState: 'idle' | 'recording' | 'paused';
  duration: number;
  eventCount: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

// 按钮逻辑
// | 状态   | 开始 | 暂停 | 恢复 | 停止 |
// |--------|------|------|------|------|
// | idle   |  ✅  |  ❌  |  ❌  |  ❌  |
// | recording | ❌ |  ✅  |  ❌  |  ✅  |
// | paused | ❌  |  ❌  |  ✅  |  ✅  |
```

### 3.4 StatusDisplay (状态显示)

```typescript
interface StatusDisplayProps {
  status: 'idle' | 'recording' | 'paused' | 'playing';
}

// 状态样式
// | 状态     | 圆点颜色 | 文字      | 动画      |
// |----------|----------|-----------|-----------|
// | idle     | gray     | 空闲      | 无        |
// | recording| green    | 录制中    | 脉冲动画  |
// | paused   | yellow   | 已暂停    | 无        |
// | playing  | blue     | 回放中    | 无        |
```

### 3.5 PlaybackControls (回放控制)

```typescript
interface PlaybackControlsProps {
  currentTime: number;
  totalTime: number;
  currentAction?: string;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onSpeedChange?: (speed: number) => void;
}
```

---

## 4. 状态机设计

```
┌─────────────────────────────────────────────────────────┐
│                    录制状态机                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│    ┌──────────┐    开始      ┌───────────┐             │
│    │   Idle    │ ──────────► │ Recording │             │
│    └──────────┘             └───────────┘             │
│         ▲                        │                     │
│         │                        │ 暂停                │
│         │ 停止                    ▼                     │
│         │                   ┌───────────┐             │
│         └────────────────── │  Paused   │             │
│                             └───────────┘             │
│                                  │                    │
│                                  │ 恢复                │
│                                  ▼                     │
│                             ┌───────────┐             │
│                             │ Recording │             │
│                             └───────────┘             │
│                                                         │
│    模式 (正交): Learn / Guide / Active                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5. 样式方案

### 5.1 主题色

```css
/* 基于现有 Neo 主题扩展 */
:root {
  /* Agent Steer 专用色 */
  --agent-steer-recording: #22c55e;   /* 录制中 - 绿色 */
  --agent-steer-paused: #eab308;      /* 已暂停 - 黄色 */
  --agent-steer-playing: #3b82f6;    /* 回放中 - 蓝色 */
  --agent-steer-idle: #6b7280;       /* 空闲 - 灰色 */
}
```

### 5.2 组件样式

```typescript
// Agent Steer 主面板
"w-80 rounded-lg border bg-background shadow-lg"

// 模式按钮组
"flex gap-2"

// 状态指示器
"flex items-center gap-2"

// 录制时长
"font-mono text-sm"
```

---

## 6. 开发任务分解

### 6.1 Phase 1: 基础 UI (MVP)

| 任务 | 组件 | 说明 |
|------|------|------|
| 1.1 | 创建页面路由 | `app/(main)/workspace/[workspace_code]/agent-steer/page.tsx` |
| 1.2 | 实现 AgentSteer 主容器 | 状态管理、布局框架 |
| 1.3 | 实现 ModeSelector | 模式切换按钮 |
| 1.4 | 实现 StatusDisplay | 状态指示器 |
| 1.5 | 实现 RecordingControls | 录制控制按钮 |

### 6.2 Phase 2: 状态机

| 任务 | 组件 | 说明 |
|------|------|------|
| 2.1 | 实现 useAgentSteer hook | 状态管理 |
| 2.2 | 连接状态到 UI | 状态驱动 UI 更新 |
| 2.3 | 添加录制时长计时 | setInterval 模拟 |

### 6.3 Phase 3: 回放控制

| 任务 | 组件 | 说明 |
|------|------|------|
| 3.1 | 实现 PlaybackControls | rrweb player 容器 |
| 3.2 | 进度条交互 | 拖拽、显示当前操作 |

### 6.4 Phase 4: 模拟环境 (可选)

| 任务 | 说明 |
|------|------|
| 4.1 | 实现 SimulatedPage | 模拟目标页面 |
| 4.2 | 实现 SimulatedCS | 模拟 Content Script |
| 4.3 | 实现 DebugPanel | 调试面板 |

---

## 7. 技术实现注意事项

1. **组件复用**: 优先使用 `components/ui/` 下的现有组件
2. **状态管理**: 使用 React hooks (useState, useEffect)，暂不引入复杂状态库
3. **类型安全**: 所有组件使用 TypeScript
4. **样式**: 使用 Tailwind CSS，与 Neo 主题保持一致
5. **图标**: 使用 lucide-react 或现有图标组件

---

*文档由 AI 辅助生成，需人工审核确认*