# Pi Agent Server - Milestones

## 概述

使用 TDD 模式开发一个基于 pi-agent 的 WebSocket 服务器，支持多 session 管理。

## 技术决策

| 维度 | 决策 |
|------|------|
| 会话持久化 | 数据库持久化 (MySQL) |
| 通信协议 | JSON-RPC 2.0 over WebSocket |
| 隔离模型 | 每连接 = 一个专属 Session |
| 并发模型 | Worker Thread 池 |

## JSON-RPC API 设计

### 客户端 → 服务端 Methods

| Method | 描述 | Params |
|--------|------|--------|
| `session.create` | 创建新 session | `{ cwd?: string, model?: string }` |
| `session.send` | 发送 prompt | `{ prompt: string, images?: Image[] }` |
| `session.steer` | 插队指令（流式中） | `{ text: string }` |
| `session.followUp` | 追加指令（流式后） | `{ text: string }` |
| `session.abort` | 中止当前执行 | `{}` |
| `session.info` | 获取 session 信息 | `{}` |

### 服务端 → 客户端 Events

| Event | 描述 |
|-------|------|
| `agent.start` | Agent 开始处理 |
| `agent.end` | Agent 完成处理 |
| `message.delta` | 文本增量 |
| `message.thinking` | 思考输出 |
| `tool.start` | 工具开始执行 |
| `tool.end` | 工具结束 |

## 进度追踪

| Milestone | Status | Completed At |
|-----------|--------|-------------|
| M0 | ✅ Completed | 2026-06-15 |
| M1 | ✅ Completed | 2026-06-15 |
| M2 | ✅ Completed | 2026-06-15 |
| M3 | ✅ Completed | 2026-06-15 |
| M4 | ✅ Completed | 2026-06-15 |
| M5 | 🔴 Not Started | - |
| M6 | 🔴 Not Started | - |
| M7 | 🔴 Not Started | - |

## Milestones

### [x] M0: 项目基础设施

**目标**: 搭建项目结构，配置 TypeScript 和测试环境

**验收测试**:
- [x] `npm install` 成功
- [x] `npm run build` 编译通过
- [x] `npm test` 运行测试

---

### [x] M1: JSON-RPC 协议层

**目标**: 实现完整的 JSON-RPC 2.0 协议处理器

**文件**: `src/protocol/jsonrpc.ts`

**验收测试**:
- [x] 构造请求/响应/错误/通知
- [x] 解析消息
- [x] 批量处理
- [x] 错误码规范

**测试**: 27 tests passed

---

### [x] M2: Worker 通信协议

**目标**: 定义 Worker 与主线程之间的通信协议

**文件**: `src/worker/messages.ts`

**验收测试**:
- [x] `MainToWorker` 类型完整 (init, prompt, steer, followUp, abort, destroy)
- [x] `WorkerToMain` 类型完整 (ready, event, error, done)
- [x] 消息解析函数
- [x] 事件类型定义

**测试**: 33 tests passed

---

### [x] M3: Worker 池管理

**目标**: 实现 Worker Thread 池，支持多 session 并发

**文件**: `src/worker/pool.ts`

**验收测试**:
- [x] 池初始化: 创建指定数量的 Worker
- [x] Worker 分配: 新 session 分配到空闲 Worker
- [x] Worker 回收: session 结束时归还 Worker 到池
- [x] 负载均衡: 优先分配空闲的 Worker
- [x] 池满处理: 等待或拒绝新连接

**测试**: 14 tests passed

---

### [x] M4: Agent Session 封装

**目标**: 在 Worker 中封装 AgentSession

**文件**: `src/worker/agent.ts`

**验收测试**:
- [x] 创建 AgentSession
- [x] `prompt()`, `steer()`, `followUp()`, `abort()`
- [x] 事件转发
- [x] 消息累积

**测试**: 17 tests passed

---

### [ ] M5: 数据库层

**目标**: Session 持久化到数据库

**目录**: `src/db/`

---

### [ ] M6: WebSocket 服务器

**目标**: 实现 WebSocket 服务器

**文件**: `src/ws/server.ts`, `src/ws/connection.ts`

---

### [ ] M7: 端到端集成

**目标**: 完整流程验证

---

## 目录结构

```
server/
├── src/
│   ├── index.ts
│   ├── config.ts
│   ├── protocol/
│   │   └── jsonrpc.ts
│   ├── worker/
│   │   ├── messages.ts
│   │   ├── pool.ts
│   │   ├── worker.ts
│   │   └── agent.ts
│   ├── db/
│   ├── ws/
│   │   └── server.ts
│   └── utils/
│       └── logger.ts
├── tests/
│   └── unit/
│       ├── protocol/
│       │   └── jsonrpc.test.ts
│       └── worker/
│           └── messages.test.ts
├── docs/
│   └── MILESTONE.md
├── package.json
├── tsconfig.json
├── tsconfig.worker.json
├── vitest.config.ts
├── Makefile
└── .gitignore
```