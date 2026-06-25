# agent-steer 集成 agent-ui-chat 技术设计要求

> 面向对象：技术设计人员
> 发起人：赵老师
> 日期：2026-06-25
> 状态：待设计

---

## 一、项目背景

### 1.1 目标

将 `@agegr/agent-ui-chat` 聊天组件集成到 agent-steer Chrome Extension，使 AI Agent 能够：

1. 与用户进行自然语言对话
2. 根据用户操作（rrweb 录制）理解上下文
3. 通过 browser-tool 操作目标页面 DOM
4. 执行 bash 命令（通过 agent-server）

### 1.2 现有系统

| 系统 | 位置 | 说明 |
|------|------|------|
| agent-steer | `matrix/neo/ui/agent-steer/` | Chrome Extension（已有录制功能） |
| neo-frontend | `matrix/neo/frontend/` | Next.js 应用（已有 auth-bridge） |
| agent-server | `neo-agents/agent-server/` | Node.js 服务（端口 30141） |
| agent-ui-chat | `neo-agents/agent-ui-chat/` | React 聊天组件库 |

---

## 二、已明确的约束

### 2.1 已有的功能（无需重新开发）

1. **用户认证** ✅
   - agent-steer 已通过 iframe-bridge 获取 JWT token
   - 机制：`neo-frontend/app/auth-bridge/user-info/page.tsx` → postMessage → chrome.storage.session
   - Token 存储在 `chrome.storage.session`

2. **rrweb 录制** ✅
   - 已有 `RrwebRecorder` 和 `useRecorder` hook
   - 功能：录制用户操作、segment 切分、上传到 backend

3. **browser-tool** ✅
   - 已有 `@agegr/browser-tool`（v0.3）
   - 功能：DOM 快照、click、fill 等操作

4. **bb-client / bb-router** ✅
   - WebSocket 协议，连接 agent-server
   - 用于将 browser-tool 操作指令发送到目标页面

### 2.2 技术约束

1. **agent-ui-chat 集成位置**：Content Script（**不是 Popup**）
   - ChatWindow 以 overlay 或 panel 形式渲染在目标页面中
   - 需要处理与 rrweb 录制的共存

2. **配置项**：agent-server 地址
   - 需要在 agent-steer 配置界面中添加 agent-server URL 配置
   - 类似现有的 workspaceCode 配置

3. **MV3 Chrome Extension**
   - 使用 Manifest V3
   - Service Worker 作为占位

---

## 三、集成架构

### 3.1 组件位置

```
Chrome Extension
├── popup/                    # 录制控制 + 配置（已有）
├── content_script/           # ⭐ agent-ui-chat + bb-client + rrweb
│   ├── chat-overlay/        # ChatWindow 渲染层
│   ├── bb-client/          # WebSocket 客户端
│   └── orchestrator/       # 事件编排
└── service_worker/          # MV3 占位
```

### 3.2 数据流

```
用户操作（目标页面）
    ↓ rrweb 录制
    ↓
content_script
    ├── ChatWindow (agent-ui-chat)
    │       ↓ SSE
    │       agent-server (30141)
    │       ↓ SDK
    │       pi-coding-agent
    │       ↓
    │       tool_call (bash / browser)
    │
    ├── bb-client
    │       ↓ WebSocket
    │       agent-server /api/ws/bb-router
    │       ↓
    │       bb-router
    │       ↓
    │       目标页面 DOM (browser-tool)
    │
    └── 目标页面
            ↑ DOM 操作结果
```

---

## 四、功能需求

### 4.1 聊天 UI

| 需求 | 说明 |
|------|------|
| ChatWindow 渲染 | 在 content script 中渲染 agent-ui-chat 的 ChatWindow 组件 |
| 流式响应 | 通过 SSE 订阅 agent-server 事件 |
| 消息显示 | 支持 markdown、代码高亮、mermaid 图表 |
| 输入框 | 支持文本输入 |
| 状态显示 | agent 运行状态、token 用量 |

### 4.2 认证与配置

| 需求 | 说明 |
|------|------|
| JWT 获取 | 从 chrome.storage.session 读取 token |
| agent-server 地址 | 在配置界面中设置，存储在 chrome.storage.local |
| 认证头传递 | Authorization: Bearer {jwt} |

### 4.3 工具调用

| 工具 | 路径 | 说明 |
|------|------|------|
| bash | agent-server 直接执行 | 文件操作、命令执行 |
| browser | bb-client → bb-router → 目标页面 | DOM 快照、click、fill |

### 4.4 与录制的协同

| 需求 | 说明 |
|------|------|
| 共存 | 聊天和录制可以同时运行 |
| 上下文共享 | 聊天可以获取当前录制的内容 |
| 切换 | 用户可以在录制控制和聊天之间切换 |

---

## 五、界面设计约束

### 5.1 ChatWindow 渲染位置

- 作为 overlay 悬浮在目标页面上
- 可拖拽、可收起
- 不会遮挡目标页面的主要内容

### 5.2 配置界面

在现有的 AgentSteerPanel 或单独的设置页面中增加：

| 配置项 | 类型 | 说明 |
|--------|------|------|
| agent-server URL | string | 例如 `http://localhost:30141` |
| 自动展开聊天 | boolean | 新消息时是否自动展开 |

### 5.3 样式约束

- 使用 `--piui-*` CSS 变量（agent-ui-chat 内置）
- 主题跟随系统/用户偏好
- 不影响目标页面的样式（Shadow DOM 隔离）

---

## 六、技术实现要点

### 6.1 Content Script 中的 React

Chrome Extension content script 运行在目标页面的 JS 上下文中，直接使用 React 可能与目标页面的 React 版本冲突。

**建议方案**：
1. 使用 Shadow DOM 隔离渲染
2. 或确保 React 版本兼容

### 6.2 agent-server 地址配置

```typescript
// 存储结构
interface AgentSteerConfig {
  agentServerUrl: string;  // 例如 "http://localhost:30141"
  autoExpandChat: boolean;
  // ... 其他配置
}
```

- 存储在 `chrome.storage.local`
- 用户在配置界面设置

### 6.3 bb-client 集成

```typescript
// content_script/agent-bridge.ts
import { BBClient } from "@agegr/bb-client";

class AgentBridge {
  private bbClient: BBClient;

  constructor(sessionId: string, agentServerUrl: string) {
    this.bbClient = new BBClient({
      url: `${agentServerUrl}/api/ws/bb-router`,
      sessionId,
    });
  }

  async snapshot() {
    // 调用 browser-tool 获取 DOM 快照
  }
}
```

### 6.4 ChatWindow 初始化

```tsx
// content_script/chat-overlay.tsx
import { ChatWindow } from "@agegr/agent-ui-chat";

function createChatOverlay() {
  const container = document.createElement("div");
  container.id = "agent-steer-chat";
  document.body.appendChild(container);

  // 从配置读取 agent-server URL
  chrome.storage.local.get(["config"], ({ config }) => {
    // 从 session 读取 JWT
    chrome.storage.session.get(["userInfo"], ({ userInfo }) => {
      const root = createRoot(container);
      root.render(
        <ChatWindow
          apiBaseUrl={config.agentServerUrl}
          session={null}
          newSessionCwd="/tmp"
          // 需要确认如何传递 authorization
        />
      );
    });
  });
}
```

---

## 七、开放问题（需技术设计确认）

1. **ChatWindow 的 authorization header**
   - agent-ui-chat 当前是否支持自定义 authorization？
   - 如不支持，是否需要修改组件支持？

2. **React 版本兼容性**
   - content script 中使用 React 19 是否与目标页面冲突？
   - 是否需要使用 Shadow DOM 隔离？

3. **ChatWindow 的事件回调**
   - `onAgentEnd`、`onSessionCreated` 等回调如何与现有逻辑集成？

4. **Session 管理**
   - 多个 tab 是否共享同一个 session？
   - session 与录制的 recordingUid 如何关联？

5. **新窗口打开**
   - agent-ui-chat 有新窗口相关功能（如代码编辑），如何处理？

---

## 八、非功能性需求

| 需求 | 说明 |
|------|------|
| 性能 | ChatWindow 加载 < 2s |
| 内存 | 不影响目标页面性能 |
| 兼容性 | 支持 Chrome 116+ |
| 离线 | 网络断开时给出友好提示 |

---

## 九、参考文档

| 文档 | 路径 |
|------|------|
| neo-agents 架构 | `neo-agents/AGENTS.md` |
| agent-ui-chat API | `neo-agents/agent-ui-chat/README.md` |
| browser-tool API | `neo-agents/browser-tool/README.md` |
| bb-protocol | `neo-agents/browser-bridge/bb-protocol/` |
| agent-steer 技术设计 | `design/docs/technical/agent-steer/index.md` |
| iframe-bridge 认证 | `design/docs/technical/auth/iframe-bridge.md` |

---

## 十、后续步骤

1. 技术设计人员确认上述约束和开放问题
2. 输出详细的技术设计文档
3. 评审通过后开始实施
