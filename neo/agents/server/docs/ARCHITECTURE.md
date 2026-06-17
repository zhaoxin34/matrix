# 架构设计

## 概述

Pi Agent Server 是一个基于 WebSocket 的多会话 Agent 服务器，使用 JSON-RPC 2.0 协议进行通信。

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│    (Browser, CLI, Python, Any WebSocket Client)                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ WebSocket
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WebSocket Server                              │
│                    (src/ws/server.ts)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Connection 1 │  │ Connection 2 │  │ Connection N │          │
│  │  (per WS)   │  │  (per WS)   │  │  (per WS)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼────────────────────┘
          │                 │                 │
          └────────┬────────┴────────┬────────┘
                   │ JSON-RPC        │
                   ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Handler                                   │
│                    (src/api/handler.ts)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              SessionManager                                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │   │
│  │  │ Session 1  │  │ Session 2  │  │ Session N  │          │   │
│  │  │ (per conn) │  │ (per conn) │  │ (per conn) │          │   │
│  │  └────────────┘  └────────────┘  └────────────┘          │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────┬────────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
┌─────────────────┐ ┌─────────┐ ┌─────────────────┐
│   Worker Pool    │ │   DB    │ │  Event Forward  │
│  (src/worker/)  │ │ (db/)   │ │                 │
│                 │ │         │ │  Session Events │
│  ┌───────────┐  │ │ Sessions│ │  ─────────────▶│
│  │ Worker 1  │  │ │ Messages│ │   WebSocket    │
│  │ (Agent)   │  │ │         │ │   Connection   │
│  └───────────┘  │ └─────────┘ │                 │
│  ┌───────────┐  │             │                 │
│  │ Worker 2  │  │             │                 │
│  └───────────┘  │             │                 │
│  ┌───────────┐    │             │                 │
│  │ Worker N │    │             │                 │
│  └───────────┘    │             │                 │
└─────────────────────┴─────────────┴─────────────────┘
```

## 模块说明

### 1. WebSocket Server (`src/ws/server.ts`)

**职责:**
- 管理 WebSocket 连接
- 消息收发
- 连接追踪
- 广播

**核心类型:**
```typescript
interface WsConnection {
  id: string;
  sessionId: string;
  state: ConnectionState;
  send(message: unknown): void;
  onMessage(handler: (msg: unknown) => void): () => void;
  // ...
}

interface WsServer {
  getConnectionCount(): number;
  broadcast(message: unknown): void;
  shutdown(): Promise<void>;
}
```

### 2. API Handler (`src/api/handler.ts`)

**职责:**
- JSON-RPC 请求解析
- 方法路由
- Session 管理
- 事件转发

**核心类型:**
```typescript
class SessionManager {
  createSession(connection: WsConnection, options?): Session;
  getSession(sessionId: string): Session | undefined;
  destroySession(sessionId: string): void;
}
```

**方法映射:**
```
session.create    → handleSessionCreate
session.send      → handleSessionSend
session.steer     → handleSessionSteer
session.followUp  → handleSessionFollowUp
session.abort     → handleSessionAbort
session.info      → handleSessionInfo
session.destroy   → handleSessionDestroy
```

### 3. Worker Pool (`src/worker/pool.ts`)

**职责:**
- Worker 线程池管理
- Worker 分配/回收
- 负载均衡

**核心类型:**
```typescript
interface WorkerPool {
  acquire(sessionId: string): Promise<number>;  // 获取空闲 Worker
  release(workerId: number): void;               // 归还 Worker
  terminate(workerId: number): void;             // 终止 Worker
  destroy(): void;                               // 销毁池
  getStats(): PoolStats;
}
```

### 4. Agent Session (`src/worker/agent.ts`)

**职责:**
- Agent 会话封装
- 事件订阅
- Prompt/Steer/FollowUp/Abort

**核心类型:**
```typescript
interface IAgentSession {
  sessionId: string;
  isStreaming: boolean;
  messages: AgentMessage[];

  prompt(text: string): Promise<void>;
  steer(text: string): Promise<void>;
  followUp(text: string): Promise<void>;
  abort(): Promise<boolean>;
  subscribe(handler: (event: SessionEvent) => void): () => void;
}
```

**注意:** 当前是 Mock 实现，用于测试。真实实现需要接入 `@earendil-works/pi-coding-agent`。

### 5. Database (`src/db/`)

**职责:**
- Session 持久化
- 消息历史
- 跨连接恢复

**表结构:**
```
sessions
├── id (PK)
├── user_id
├── worker_id
├── cwd
├── model_id
├── thinking_level
├── status (idle/active/paused/terminated)
└── timestamps

messages
├── id (PK)
├── session_id (FK)
├── role (user/assistant/system/tool)
├── content
└── created_at
```

### 6. JSON-RPC Protocol (`src/protocol/jsonrpc.ts`)

**职责:**
- JSON-RPC 2.0 解析
- 请求/响应构造
- 错误处理

## 数据流

### 1. 创建 Session 并发送 Prompt

```
Client                    Server                     Session                 Agent
  │                         │                          │                      │
  │──WS Connect─────────────▶│                          │                      │
  │                         │──Connection created─────▶│                      │
  │                         │                          │                      │
  │──JSON-RPC──────────────▶│                          │                      │
  │  {method: session.create}                        │                      │
  │                         │──createSession()────────▶│                      │
  │                         │                          │──Session created────▶│
  │◀──Response──────────────│                          │                      │
  │  {sessionId: "..."}     │                          │                      │
  │                         │                          │                      │
  │──JSON-RPC──────────────▶│                          │                      │
  │  {method: session.send} │                          │                      │
  │  {params: {prompt: ...}}                         │                      │
  │                         │──session.prompt()────────▶│                      │
  │                         │                          │──prompt()───────────▶│
  │                         │◀──events─────────────────│◀──events─────────────│
  │◀──agent.event───────────│◀──forward to connection───│                      │
  │  {type: message_delta}  │                          │                      │
  │                         │                          │◀──done───────────────│
  │◀──agent.event───────────│◀──agent_end───────────────│                      │
  │  {type: agent_end}      │                          │                      │
```

### 2. Steer (重定向)

```
Client                    Server                     Session
  │                         │                          │
  │◀──agent.event───────────│◀──message_delta───────────│
  │  {type: message_delta}  │                          │
  │                         │                          │
  │──JSON-RPC──────────────▶│                          │
  │  {method: session.steer}│                          │
  │  {params: {text: "..."}}                         │
  │                         │──session.steer()────────▶│
  │                         │◀──queue_update────────────│
  │◀──agent.event───────────│◀──{type: queue_update}───│
  │  {type: queue_update}   │                          │
  │  {steer: "..."}         │                          │
```

## 会话生命周期

```
┌────────────────────────────────────────────────────────────┐
│                      Session Lifecycle                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐                                               │
│   │ created  │ ◀── session.create                           │
│   └────┬─────┘                                               │
│        │                                                     │
│        ▼                                                     │
│   ┌──────────┐                                               │
│   │  idle    │ ◀── Session created, waiting for input       │
│   └────┬─────┘                                               │
│        │ session.send()                                      │
│        ▼                                                     │
│   ┌──────────┐                                               │
│   │ active   │ ◀── Processing prompt (isStreaming = true)   │
│   └────┬─────┘                                               │
│        │                                                     │
│        ├────── session.abort() ────▶ ┌──────────┐           │
│        │                              │ aborted  │           │
│        │                              └────┬─────┘           │
│        │                                   │                 │
│        │                                   ▼                 │
│        │                              (back to idle)        │
│        │                                                     │
│        ├────── prompt done ──────────▶ ┌──────────┐         │
│        │                              │  idle    │         │
│        │                              └────┬─────┘         │
│        │                                   │                 │
│        │                                   │                 │
│        └────── session.destroy() ─────────▶ (end)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 错误处理策略

| 场景 | 处理 |
|------|------|
| Session 不存在 | 自动创建新 Session (对于 session.* 方法) |
| Session 正忙 | 返回 `SESSION_BUSY` 错误 |
| 请求解析失败 | 返回 `PARSE_ERROR` |
| 方法不存在 | 返回 `METHOD_NOT_FOUND` |
| 参数无效 | 返回 `INVALID_PARAMS` |
| Agent 执行错误 | 返回 `AGENT_ERROR` 并发送错误事件 |
| 连接断开 | Session 保持 (可恢复) 或超时清理 |

## 扩展点

### 1. 接入真实 Agent

替换 `src/worker/agent.ts` 中的 Mock 实现：

```typescript
// 替换前
import { createMockAgentSession } from './mock';

// 替换后
import { createAgentSession } from '@earendil-works/pi-coding-agent';
```

### 2. 添加认证

在 WebSocket Server 层添加认证：

```typescript
server.on('connection', (socket, request) => {
  const token = parseToken(request);
  if (!validateToken(token)) {
    socket.close(4001, 'Unauthorized');
    return;
  }
  // continue...
});
```

### 3. 添加中间件

在 API Handler 添加请求/响应中间件：

```typescript
async function handleRequest(data, connection) {
  // Pre-middleware
  const ctx = await auth(connection);
  if (!ctx) return error('Unauthorized');

  // Handler
  const result = await process(ctx);

  // Post-middleware
  await log(ctx, result);

  return result;
}
```

## 性能考虑

- **Worker 池大小**: 根据 CPU 核心数和并发需求调整
- **连接限制**: 默认 100 连接，可配置
- **Session 清理**: 空闲 Session 超时清理
- **消息批量**: 支持批量请求减少往返

## 监控指标

建议监控:
- 连接数
- 活跃 Session 数
- Worker 利用率
- 请求延迟
- Agent 执行时间
