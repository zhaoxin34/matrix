# agent-steer 集成 agent-ui-chat 方案

> 目标：将 `@agegr/agent-ui-chat` 集成到 agent-steer Chrome Extension
> 状态：方案设计
> 日期：2026-06-25

## 1. 当前架构

### 1.1 agent-steer（Chrome Extension）

```
agent-steer/
├── ui/agent-steer/                    # UI 高保真原型
│   ├── agent-steer-fab-dialog.html   # FAB 弹窗原型
│   └── .od-skills/                   # OpenDesign 技能
├── frontend/
│   ├── components/agent-steer-panel.tsx  # 录制控制面板
│   ├── hooks/use-recorder.ts         # rrweb 录制逻辑
│   └── app/(main)/workspace/[workspace_code]/agent-steer-demo/  # Demo 页面
└── backend/                          # Python FastAPI (port 8000)
```

**现有功能**：
- rrweb 录制用户操作
- segment 切分和上传
- 录制状态管理

**缺失功能**：
- AI Agent 对话 UI
- 与 agent-server 通信

### 1.2 neo-agents

```
neo-agents/
├── agent-server/       # 后端服务 (30141)
├── agent-ui-chat/      # 可复用聊天组件库 ✅
├── agent-ui-demo/      # 组件测试应用 (30145)
└── browser-tool/       # DOM 操作工具库
```

---

## 2. 集成目标

将 `agent-ui-chat` 的 `ChatWindow` 组件集成到 agent-steer，提供：

1. **聊天 UI** - 在 agent-steer 面板中显示 AI 对话
2. **流式响应** - SSE 订阅 agent-server
3. **工具调用** - bash/read/edit 等工具通过 bb-client 执行
4. **DOM 操作** - 通过 browser-tool 操作目标页面

---

## 3. 架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                          │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │   Popup     │    │ Content Script │    │  Target Page  │  │
│  │             │    │              │    │               │  │
│  │ ┌────────┐ │    │ ┌──────────┐ │    │               │  │
│  │ │ChatWindow│    │ │rrweb     │ │    │               │  │
│  │ │         │ │    │ │Recorder  │ │    │               │  │
│  │ └────────┘ │    │ └──────────┘ │    │               │  │
│  │             │    │ ┌──────────┐ │    │               │  │
│  │             │    │ │bb-client │ │    │               │  │
│  │             │    │ └──────────┘ │    │               │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                   │                   │
         │                   │                   │ iframe/JS
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     agent-server (30141)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  REST API    │  │  SSE Stream  │  │  BB Router (WS)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                            │                   │           │
│                            ▼                   ▼           │
│                    ┌──────────────────────────────┐         │
│                    │     pi-coding-agent SDK      │         │
│                    └──────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 组件位置

| 组件 | 位置 | 说明 |
|------|------|------|
| `ChatWindow` | Popup | 聊天 UI，用户交互入口 |
| `useAgentSession` | Popup/Content Script | SSE 订阅 + 状态管理 |
| `bb-client` | Content Script | WebSocket 客户端，与目标页面 DOM 交互 |
| `RrwebRecorder` | Content Script | 录制用户操作 |

### 3.3 消息流

```
用户输入 → ChatWindow → useAgentSession → SSE stream
                                            │
                                            ▼
                                   ┌────────────────┐
                                   │  agent-server   │
                                   │  (REST + SSE)  │
                                   └────────────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                 ▼                 ▼
                   tool_execution    bb-router (WS)    other events
                   start/end              │                 │
                          ┌──────────────┘                 │
                          ▼                                │
                   ┌────────────┐                          │
                   │ bb-client  │                          │
                   └────────────┘                          │
                          │                                │
                          ▼                                │
                   ┌─────────────────────┐                 │
                   │   Target Page DOM   │                 │
                   │  (via bb-protocol)  │                 │
                   └─────────────────────┘                 │
```

---

## 4. 集成步骤

### 阶段 1：基础集成（ChatWindow in Popup）

**目标**：在 Chrome Extension Popup 中显示 ChatWindow

#### 步骤 1.1：准备 agent-ui-chat 构建产物

```bash
cd /Volumes/data/working/ai/neo-agents/agent-ui-chat
pnpm build
# 输出：dist/agent-ui-chat.{js,css}
```

#### 步骤 1.2：配置 Chrome Extension

```json
// manifest.json (MV3)
{
  "content_scripts": [...],
  "permissions": [
    "storage",
    "activeTab",
    "nativeMessaging"
  ],
  "host_permissions": [
    "http://localhost:30141/*",
    "https://*/*"
  ]
}
```

#### 步骤 1.3：构建 Popup UI

```tsx
// popup/components/AgentChat.tsx
import { ChatWindow } from "@agegr/agent-ui-chat";
import { useAuth } from "../hooks/useAuth"; // JWT 获取

export function AgentChat({ sessionId }) {
  const { token } = useAuth(); // 从 chrome.storage.session 获取 JWT

  return (
    <ChatWindow
      session={sessionId ? { id: sessionId } : null}
      newSessionCwd="/tmp"
      apiBaseUrl="http://localhost:30141"
      authorization={token}  // 需要确认 ChatWindow 是否支持
    />
  );
}
```

#### 步骤 1.4：处理认证

根据 neo-agents 文档，认证流程：

```
Frontend → iframe postMessage → agent-steer chrome.storage.session
                                      ↓
                              agent-ui-chat 读取 token
                                      ↓
                              Authorization: Bearer {jwt} → agent-server
```

### 阶段 2：bb-client 集成（DOM 操作）

**目标**：让 AI Agent 能够操作目标页面 DOM

#### 步骤 2.1：安装 bb-client

```bash
cd agent-steer-extension
npm install @agegr/bb-client
```

#### 步骤 2.2：配置 Content Script

```typescript
// content-script/agent-bridge.ts
import { BBClient } from "@agegr/bb-client";
import { createBrowserTool } from "@agegr/browser-tool";

export class AgentBridge {
  private bbClient: BBClient;
  private browserTool: ReturnType<typeof createBrowserTool>;

  constructor() {
    this.bbClient = new BBClient({
      url: "ws://localhost:30141/api/ws/bb-router",
      sessionId: this.getSessionId(),
    });

    this.browserTool = createBrowserTool((action) => {
      return this.bbClient.send(action);
    });
  }

  // 快照目标页面 DOM
  snapshot(): Promise<SnapshotResult> {
    return this.browserTool.snapshot();
  }

  // 执行 DOM 操作
  click(id: string): Promise<OperationResult> {
    return this.browserTool.click(id);
  }

  fill(id: string, value: string): Promise<OperationResult> {
    return this.browserTool.fill(id, value);
  }
}
```

### 阶段 3：事件编排

**目标**：协调录制、对话、DOM 操作

```typescript
// content-script/orchestrator.ts
export class AgentOrchestrator {
  private recorder: RrwebRecorder;
  private bridge: AgentBridge;
  private chat: AgentChatBridge;

  constructor() {
    this.recorder = new RrwebRecorder();
    this.bridge = new AgentBridge();
    this.chat = new AgentChatBridge();
  }

  // AI 请求 DOM 快照
  onAgentRequestSnapshot() {
    const snapshot = await this.bridge.snapshot();
    this.chat.sendToolResult("browser", { snapshot });
  }

  // AI 请求 DOM 操作
  onAgentRequestAction(action: string, id: string, ...args) {
    const result = await this.bridge[action](id, ...args);
    this.chat.sendToolResult("browser", result);
  }
}
```

---

## 5. 技术挑战与解决方案

### 5.1 ChatWindow 在 MV3 Extension 中的使用

**问题**：ChatWindow 是 React 组件，Popup 是独立的 HTML 页面

**方案**：
1. Popup 使用 `<script type="module">` 加载 React
2. 或者：Popup 渲染到 `#root` div
3. 或者：使用 `chrome.sidePanel`（Chrome 116+）

### 5.2 CORS 问题

**问题**：Extension 与 agent-server 不同源

**方案**：
- agent-server 已配置 CORS（见 `proxy.ts`）
- 或者 Extension 使用 `chrome.runtime.connectNative`

### 5.3 JWT Token 传递

**问题**：ChatWindow 需要 Authorization header

**方案**：
1. 在 `useAgentSession` 中注入 header
2. 或者通过 `apiBaseUrl` 传递 token
3. 需要修改 ChatWindow 支持 `authorization` prop

### 5.4 WebSocket 连接

**问题**：`/api/ws/bb-router` WebSocket 在 Extension 中使用

**方案**：
- bb-client 已支持浏览器环境
- 需要配置 `Sec-WebSocket-Protocol`
- Extension 需要 `"permissions": ["webSocket"]`

---

## 6. 依赖版本

| 包 | 版本 | 来源 | 用途 |
|----|------|------|------|
| `@agegr/agent-ui-chat` | 0.1.x | neo-agents | 聊天 UI |
| `@agegr/bb-client` | 2.2.x | neo-agents | WS 客户端 |
| `@agegr/browser-tool` | 0.3.x | neo-agents | DOM 工具 |
| `react` | 19.x | - | UI 框架 |
| `rrweb` | latest | npm | 录制 |

---

## 7. 文件结构规划

```
agent-steer-extension/
├── src/
│   ├── manifest.json
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── AgentChat.tsx      # ChatWindow 包装
│   │   │   ├── RecordingPanel.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts        # JWT 获取
│   │   └── styles/
│   │       └── popup.css
│   ├── content-script/
│   │   ├── agent-bridge.ts       # bb-client 封装
│   │   ├── recorder.ts           # rrweb 封装
│   │   └── orchestrator.ts       # 事件编排
│   └── background/
│       └── service-worker.ts
├── package.json
└── tsconfig.json
```

---

## 8. TODO 清单

### 高优先级
- [ ] 确认 ChatWindow 支持自定义 authorization header
- [ ] 确认 bb-client 在 Extension 环境可用
- [ ] 验证 agent-server CORS 配置支持 Extension origin

### 中优先级
- [ ] 设计 Popup → Content Script 通信协议
- [ ] 实现 JWT iframe-bridge（复用 neo-frontend）
- [ ] 实现 bb-client 与 browser-tool 集成

### 低优先级
- [ ] 性能优化（懒加载 ChatWindow）
- [ ] 离线支持
- [ ] 多语言

---

## 9. 参考文档

- [neo-agents 技术设计](./neo-agents)
- [Browser Bridge 详细设计](./browser-bridge)
- [agent-ui-chat API 文档](https://github.com/zhaoxin34/neo-agents/tree/main/agent-ui-chat)
- [Chrome Extension MV3 文档](https://developer.chrome.com/docs/extensions/mv3/)

---

## 10. 开放问题

1. **ChatWindow 是否支持自定义 header？** 需要确认或修改
2. **bb-client 是否需要修改才能在 Extension 运行？** 需要测试
3. **Popup 使用 React 19 是否有兼容性问题？** 需要验证
4. **Session 如何与录制关联？** 需设计关联机制
