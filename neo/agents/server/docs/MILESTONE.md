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
| M5 | ✅ Completed | 2026-06-15 |
| M6 | ✅ Completed | 2026-06-17 |
| M7 | ✅ Completed | 2026-06-17 |

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

### [x] M5: 数据库层

**目标**: Session 持久化到数据库

**目录**: `src/db/`

**文件**:
- `config.ts` - 数据库配置（MySQL/SQLite）
- `schema.ts` - 表结构定义
- `repository.ts` - Session/Message 仓库

**验收测试**:
- [x] MySQL 生产配置
- [x] SQLite 测试配置（内存模式）
- [x] Session CRUD
- [x] Message CRUD
- [x] 级联删除

**测试**: 17 tests passed

---

### [x] M6: WebSocket 服务器

**目标**: 实现 WebSocket 服务器

**文件**: `src/ws/server.ts`

**验收测试**:
- [x] WebSocket 连接管理
- [x] 消息发送/接收
- [x] 连接追踪
- [x] 广播功能
- [x] 优雅关闭

**测试**: 15 tests passed

---

### [x] M7: 端到端集成

**目标**: 完整流程验证

**文件**: `src/api/handler.ts`

**验收测试**:
- [x] `session.create` - 创建 Session
- [x] `session.send` - 发送 prompt
- [x] `session.steer/followUp` - 流式控制
- [x] `session.abort` - 中止执行
- [x] `session.info/destroy` - 会话管理
- [x] 错误处理
- [x] 批量请求

**测试**: 14 tests passed

---

## 项目总结

### 📁 完整目录结构

```
server/
├── src/
│   ├── api/
│   │   └── handler.ts          # M7: JSON-RPC API 处理器
│   ├── config.ts               # 全局配置
│   ├── db/
│   │   ├── config.ts           # M5: 数据库配置 (MySQL/SQLite)
│   │   ├── repository.ts       # M5: Session/Message 仓库
│   │   └── schema.ts          # M5: 表结构定义
│   ├── index.ts                # 入口文件
│   ├── protocol/
│   │   └── jsonrpc.ts          # M1: JSON-RPC 2.0 协议
│   ├── utils/
│   │   └── logger.ts           # 日志工具
│   ├── worker/
│   │   ├── agent.ts            # M4: Agent Session (Mock)
│   │   ├── messages.ts         # M2: Worker 消息协议
│   │   └── pool.ts            # M3: Worker 池管理
│   └── ws/
│       └── server.ts           # M6: WebSocket 服务器
├── tests/unit/
│   ├── api/
│   │   └── handler.test.ts     # M7 测试 (14 tests)
│   ├── db/
│   │   └── repository.test.ts   # M5 测试 (17 tests)
│   ├── protocol/
│   │   └── jsonrpc.test.ts     # M1 测试 (21 tests)
│   ├── worker/
│   │   ├── agent.test.ts       # M4 测试 (17 tests)
│   │   ├── messages.test.ts    # M2 测试 (22 tests)
│   │   └── pool.test.ts       # M3 测试 (14 tests)
│   └── ws/
│       └── server.test.ts      # M6 测试 (15 tests)
├── docs/
│   ├── README.md               # 快速开始指南
│   ├── API.md                 # API 参考文档
│   ├── ARCHITECTURE.md        # 架构设计文档
│   └── MILESTONE.md           # 里程碑文档
├── package.json
├── tsconfig.json
├── tsconfig.worker.json
├── vitest.config.ts
├── Makefile
└── .gitignore
```

### 📊 测试覆盖

| 模块 | 测试文件 | 测试数 |
|------|----------|--------|
| JSON-RPC 协议 | `jsonrpc.test.ts` | 21 |
| Worker 消息 | `messages.test.ts` | 22 |
| Worker 池 | `pool.test.ts` | 14 |
| Agent Session | `agent.test.ts` | 17 |
| 数据库 | `repository.test.ts` | 17 |
| WebSocket | `server.test.ts` | 15 |
| API Handler | `handler.test.ts` | 14 |
| **总计** | **7 files** | **120** |

### 🔧 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Node.js (>=20) |
| 语言 | TypeScript |
| WebSocket | `ws` |
| 数据库 | Knex.js + MySQL/SQLite |
| 测试 | Vitest |
| Agent SDK | `@earendil-works/pi-coding-agent` (Mock) |

### 📝 下一步

- [x] M8: 前端 UI 组件库 ✅
- [ ] 接入真实 pi SDK
- [ ] 集成到 Neo 主应用
