---
id: auth-session
title: Agent Server 认证与 Session 设计
sidebar_position: 11
author: Joky.Zhao
created: 2026-06-26
updated: 2026-06-26
version: 1.0.0
tags: [Agent, Auth, Session, agent-server, WebSocket, BBP]
---

# Agent Server 认证与 Session 设计

> agent-server 跟调用方(Chrome Extension / Neo Backend)之间的**认证形态**与 **Session 生命周期**。

---

## 1. 背景

agent-server 是个独立的 Next.js 服务,跟两个方向的服务交互:

- **Content Script → agent-server**:浏览器通过 HTTP REST / SSE / WebSocket(BBP 协议)调 agent-server,完成 pi session 交互
- **agent-server → Backend**:agent-server 主动发 HTTP 请求调 backend,完成业务

**进程关系**(关键架构事实):

| 关系 | 同进程? | 通信方式 |
|------|--------|----------|
| Content Script ↔ agent-server | ❌(浏览器 vs Node.js 服务) | HTTP / WebSocket / SSE |
| agent-server ↔ Backend | ❌(两个独立服务) | HTTP |
| agent-server ↔ bb-router | ✅(bb-router 是 agent-server 内部模块) | 进程内 API(**不走网络**) |

**认证分工**:

| 角色 | 职责 |
|------|------|
| **Neo Backend** | 签发 JWT,管理用户身份 |
| **Content Script** | 从 iframe-bridge 拿 JWT,每次调 agent-server 时带 `Authorization: Bearer {jwt}` |
| **agent-server** | **只验证 JWT,不签发**;生成 sessionId(本地使用,无业务含义) |
| **agent-server → Backend** | 主动调 backend HTTP API 完成业务(同 Header 透传 JWT) |

---

## 2. Session 生命周期

### 2.1 SessionId 格式

**UUID v7**(基于时间,可排序):

```
019f030b-4821-70d1-9903-e85aede5c3b4
└── timestamp ──┘└── random ─────────┘
```

由 pi-coding-agent SDK 在 `startRpcSession` 内部生成。**只用于 agent-server 内部标识 session,不带业务含义**。

### 2.2 创建 / 交互

| 阶段 | 端点 | 行为 |
|------|------|------|
| **创建** | `POST /api/agent/new` | 校验 `cwd` 存在 → `startRpcSession` 启动 pi session → 立即发第一个 command → 返回 `{ sessionId, data }` |
| **交互** | `POST /api/agent/[id]` | `session.send(command)` — 接受 prompt / abort / fork / compact 等命令 |
| **事件流** | `GET /api/agent/[id]/events` (SSE) | 推送 session 状态变化、LLM 消息、工具调用、thinking 文本 |

---

## 3. WebSocket 形态

**端点**:`ws://localhost:30141/api/ws/bb-router?sessionId={sessionId}`

**握手**:

1. 解析 query 拿 `sessionId`,缺失则 `ws.close(4001, "sessionId required")`
2. **验签 `Authorization: Bearer {jwt}`** — 用 backend 的 `JWT_SECRET_KEY` 验签
3. 验签成功 → `userId = payload.sub`,注册到 `bbRouter`(维护 `(sessionId → WebSocket)` 映射)
4. 验签失败 → `ws.close(4001, "unauthorized")`

**消息**:BBP 协议,详见 [Browser Bridge 消息协议](./browser-bridge-protocol)。rpc-manager 跟 bb-client 通信走进程内 API,不走 WebSocket。

---

## 4. 配置

```bash
# agent-server/.env
BACKEND_URL="http://localhost:8000"              # agent-server 调 backend 用
```

---

## 5. 当前未实现

**agent-server 唯一没做的事:用 JWT token 去 backend 校验。**

当前 v1 行为:

- `/api/agent/new` / `/api/agent/[id]` 等所有 HTTP 端点 → 完全无认证,任何人都能调
- WebSocket `/api/ws/bb-router` → 跳过 JWT 验签,`userId = 0` 占位

**实现思路**(待做):

1. HTTP 端点:读 `Authorization` header → `jwt.decode(token, JWT_SECRET_KEY)` → 验签失败返 401
2. WebSocket 握手:同上,失败 `ws.close(4001, "unauthorized")`
3. 验签成功后,`userId = payload.sub` 注入 request context(供限流/审计/会话隔离用)
4. agent-server 调 backend 时,带上同样的 `Authorization: Bearer {jwt}`(原样透传)

---

## 🔗 相关文档

- [Neo Agents 工程架构](./neo-agents) — 模块结构
- [Browser Bridge 详细设计](./browser-bridge) — WebSocket 协议设计
- [Browser Bridge 消息协议](./browser-bridge-protocol) — BBP 消息定义
- [Agent Steer 技术设计](./index) — Chrome Extension 总览
- [iframe Bridge 认证桥接](../auth/iframe-bridge) — Chrome Extension ↔ Neo backend(跟 agent-server 无关,作参考)

## 📂 实际代码路径

- `agent-server/server.ts` — Next.js + WebSocket 入口
- `agent-server/app/api/agent/new/route.ts` — session 创建
- `agent-server/app/api/agent/[id]/route.ts` — session 交互
- `agent-server/app/api/agent/[id]/events/route.ts` — SSE 事件流
- `agent-server/lib/rpc-manager.ts` — `startRpcSession` / `getRpcSession`
