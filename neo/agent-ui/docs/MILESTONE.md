# M8: 前端 UI 组件库

## 概述

创建可复用的 React 组件库 `@neo/agent-ui`，用于连接 `pi-agent-server`。

## 技术选型

| 模块 | 技术 | 说明 |
|------|------|------|
| 框架 | React 18 + TypeScript | 无框架依赖 |
| 构建 | Vite 5 | 快速构建 + 库模式 |
| 状态 | Zustand | 轻量状态管理 |
| 输出 | ESM + CJS | 兼容多种环境 |

## 目录结构

```
agent-ui/           # 可复用组件库
├── src/
│   ├── components/    # React 组件
│   ├── hooks/         # Zustand Store
│   ├── lib/           # WebSocket 客户端
│   ├── types/         # TypeScript 类型
│   └── index.ts       # 导出入口
├── dist/              # 构建产物
├── index.html         # Demo 页面
└── package.json
```

```
agents/
├── server/            # pi-agent-server (后端)
│   ├── src/
│   └── docs/
└── agent-ui/          # @neo/agent-ui (前端组件库)
    ├── src/
    └── docs/
```
│   │   ├── AgentChat.tsx      # 主组件
│   │   ├── ChatInput.tsx      # 输入框
│   │   ├── MessageList.tsx    # 消息列表
│   │   ├── MessageItem.tsx    # 单条消息
│   │   └── AgentStatus.tsx    # 状态指示
│   ├── hooks/
│   │   └── use-agent-store.ts # Zustand Store
│   ├── lib/
│   │   └── agent-client.ts    # WebSocket 客户端
│   ├── types/
│   │   └── index.ts           # 类型定义
│   └── index.ts               # 导出入口
├── index.html                  # Demo 页面
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 核心组件

### AgentChat

主组件，包含完整的对话界面。

```tsx
import { AgentChat } from '@neo/agent-ui';

function App() {
  return <AgentChat endpoint="ws://localhost:8080" />;
}
```

### useAgentStore

Zustand Store，管理连接状态和消息。

```tsx
import { useAgentStore } from '@neo/agent-ui';

function MyComponent() {
  const { messages, sendMessage, isStreaming } = useAgentStore();
  // ...
}
```

### AgentClient

低层次 WebSocket 客户端封装。

```tsx
import { getAgentClient } from '@neo/agent-ui';

const client = getAgentClient();
await client.connect('ws://localhost:8080');
await client.call('session.send', { prompt: 'Hello' });
```

## 使用方式

### 1. npm 包引入

```json
{
  "dependencies": {
    "@neo/agent-ui": "file:../frontend"
  }
}
```

```tsx
import { AgentChat } from '@neo/agent-ui';

export default function App() {
  return <AgentChat />;
}
```

### 2. 单独引入组件

```tsx
import { ChatInput, MessageList, AgentStatus } from '@neo/agent-ui';
import { useAgentStore } from '@neo/agent-ui';

function CustomUI() {
  const { messages, isStreaming } = useAgentStore();
  
  return (
    <div>
      <AgentStatus state="connected" />
      <MessageList messages={messages} />
      <ChatInput onSend={(msg) => console.log(msg)} />
    </div>
  );
}
```

## 下一步

- [ ] 构建并发布 npm 包
- [ ] 添加样式定制（CSS 变量）
- [ ] 添加单元测试
- [ ] 集成到 Neo 主应用
