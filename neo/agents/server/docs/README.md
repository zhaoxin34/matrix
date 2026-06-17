# Pi Agent Server

基于 pi-agent 的 WebSocket 服务器，支持多 session 并发管理。

[![Tests](https://img.shields.io/badge/tests-120%20passed-brightgreen)](.)
[![Milestones](https://img.shields.io/badge/milestones-M0--M7%20%E5%AE%8C%E6%88%90-brightgreen)]()

## 特性

- 🌐 **WebSocket 通信** - 支持浏览器和任何 WebSocket 客户端
- 📡 **JSON-RPC 2.0** - 行业标准协议，兼容 LangChain A2A
- 🔄 **多 Session 支持** - 每连接一个独立 Session
- ⚡ **流式事件** - 实时接收 Agent 输出
- 🗄️ **数据库持久化** - MySQL/SQLite 支持
- ✅ **完整测试** - 120 个单元测试

## 快速开始

### 安装

```bash
cd server
npm install
```

### 配置

创建 `.env` 文件：

```bash
# 数据库 (可选，默认使用 SQLite)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=neo

# 服务器
PORT=8080
HOST=localhost

# 模型 (用于真实 AI 调用)
ANTHROPIC_API_KEY=sk-xxx
```

### 运行

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

### 测试

```bash
npm test
```

## API 参考

### WebSocket 连接

```javascript
const ws = new WebSocket('ws://localhost:8080?session=my-session');

// 接收消息
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};

// 发送请求
ws.send(JSON.stringify({
  jsonrpc: '2.0',
  method: 'session.send',
  params: { prompt: 'Hello!' },
  id: 1
}));
```

---

### Methods

#### `session.create`

创建新 Session。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "method": "session.create",
  "params": {
    "cwd": "/workspace",
    "thinkingLevel": "high"
  },
  "id": 1
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "sessionId": "uuid-xxx",
    "status": "created"
  },
  "id": 1
}
```

---

#### `session.send`

发送 Prompt 给 Agent。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "method": "session.send",
  "params": {
    "prompt": "帮我写一个 hello world 程序"
  },
  "id": 2
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "status": "processing",
    "sessionId": "uuid-xxx"
  },
  "id": 2
}
```

**流式事件：**
```json
{
  "jsonrpc": "2.0",
  "method": "agent.event",
  "params": {
    "type": "agent_start"
  }
}
```
```json
{
  "jsonrpc": "2.0",
  "method": "agent.event",
  "params": {
    "type": "message_delta",
    "messageId": "msg-1",
    "delta": "Hello"
  }
}
```
```json
{
  "jsonrpc": "2.0",
  "method": "agent.event",
  "params": {
    "type": "message_delta",
    "messageId": "msg-1",
    "delta": ", World!"
  }
}
```
```json
{
  "jsonrpc": "2.0",
  "method": "agent.event",
  "params": {
    "type": "agent_end",
    "messages": [...]
  }
}
```

---

#### `session.steer`

在流式执行中插入指令。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "method": "session.steer",
  "params": {
    "text": "停！换个方向"
  },
  "id": 3
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "status": "steered"
  },
  "id": 3
}
```

---

#### `session.followUp`

在当前执行完成后追加指令。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "method": "session.followUp",
  "params": {
    "text": "另外，把注释也加上"
  },
  "id": 4
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "status": "queued"
  },
  "id": 4
}
```

---

#### `session.abort`

中止当前执行。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "method": "session.abort",
  "params": {},
  "id": 5
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "aborted": true
  },
  "id": 5
}
```

---

#### `session.info`

获取 Session 信息。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "method": "session.info",
  "params": {},
  "id": 6
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "sessionId": "uuid-xxx",
    "isStreaming": false,
    "messageCount": 4,
    "cwd": "/tmp",
    "modelId": null,
    "thinkingLevel": "medium"
  },
  "id": 6
}
```

---

#### `session.destroy`

销毁 Session。

**请求：**
```json
{
  "jsonrpc": "2.0",
  "method": "session.destroy",
  "params": {},
  "id": 7
}
```

**响应：**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "status": "destroyed"
  },
  "id": 7
}
```

---

### 事件类型

| 事件类型 | 描述 |
|----------|------|
| `agent_start` | Agent 开始处理 |
| `agent_end` | Agent 完成处理 |
| `message_start` | 消息开始 |
| `message_delta` | 文本增量 |
| `message_thinking` | 思考输出 |
| `message_end` | 消息结束 |
| `tool_start` | 工具开始执行 |
| `tool_update` | 工具输出 |
| `tool_end` | 工具结束 |
| `queue_update` | 队列更新 (steer/followUp) |

---

### 错误码

| 错误码 | 含义 |
|--------|------|
| `-32700` | Parse Error - 无效 JSON |
| `-32600` | Invalid Request - 无效请求 |
| `-32601` | Method Not Found - 方法不存在 |
| `-32602` | Invalid Params - 无效参数 |
| `-32603` | Internal Error - 内部错误 |
| `-32001` | Session Not Found - Session 不存在 |
| `-32002` | Session Busy - Session 正忙 |
| `-32003` | Agent Error - Agent 执行错误 |

---

## 批量请求

支持同时发送多个请求：

```json
[
  { "jsonrpc": "2.0", "method": "session.create", "id": 1 },
  { "jsonrpc": "2.0", "method": "session.info", "id": 2 }
]
```

---

## 客户端示例

### JavaScript (浏览器)

```javascript
class PiAgentClient {
  constructor(url = 'ws://localhost:8080') {
    this.url = url;
    this.ws = null;
    this.handlers = new Map();
    this.pending = new Map();
    this.id = 0;
  }

  connect(sessionId) {
    return new Promise((resolve, reject) => {
      const url = sessionId 
        ? `${this.url}?session=${sessionId}`
        : this.url;
      
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (e) => this._handle(e.data);
    });
  }

  async call(method, params = {}) {
    const id = ++this.id;
    const request = { jsonrpc: '2.0', method, params, id };
    
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(request));
    });
  }

  _handle(data) {
    const msg = JSON.parse(data);
    
    // Notification (event)
    if (msg.method === 'agent.event') {
      this.handlers.forEach(h => h(msg.params));
      return;
    }
    
    // Response
    if (msg.id) {
      const pending = this.pending.get(msg.id);
      if (pending) {
        this.pending.delete(msg.id);
        if (msg.error) {
          pending.reject(new Error(msg.error.message));
        } else {
          pending.resolve(msg.result);
        }
      }
    }
  }

  onEvent(handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  // Convenience methods
  async create(params) {
    return this.call('session.create', params);
  }

  async send(prompt) {
    return this.call('session.send', { prompt });
  }

  async steer(text) {
    return this.call('session.steer', { text });
  }

  async followUp(text) {
    return this.call('session.followUp', { text });
  }

  async abort() {
    return this.call('session.abort');
  }

  async info() {
    return this.call('session.info');
  }

  async destroy() {
    return this.call('session.destroy');
  }

  close() {
    this.ws?.close();
  }
}

// 使用示例
const client = new PiAgentClient();

await client.connect();

client.onEvent((event) => {
  if (event.type === 'message_delta') {
    process.stdout.write(event.delta);
  }
  if (event.type === 'agent_end') {
    console.log('\n--- Done ---');
  }
});

await client.send('给我写一个斐波那契数列函数');
```

---

### Python

```python
import json
import asyncio
from websockets.sync import client

class PiAgentClient:
    def __init__(self, url="ws://localhost:8080"):
        self.url = url
        self.ws = None
        self.handlers = []
        self.pending = {}
        self._id = 0
    
    def connect(self, session_id=None):
        url = f"{self.url}?session={session_id}" if session_id else self.url
        self.ws = client.connect(url)
    
    def call(self, method, params=None):
        self._id += 1
        request = {"jsonrpc": "2.0", "method": method, "params": params or {}, "id": self._id}
        self.ws.send(json.dumps(request))
        
        while True:
            response = json.loads(self.ws.recv())
            if response.get("method") == "agent.event":
                for handler in self.handlers:
                    handler(response["params"])
            elif response.get("id") == self._id:
                if "error" in response:
                    raise Exception(response["error"]["message"])
                return response["result"]
    
    def on_event(self, handler):
        self.handlers.append(handler)
        return lambda: self.handlers.remove(handler)
    
    def create(self, params=None):
        return self.call("session.create", params)
    
    def send(self, prompt):
        return self.call("session.send", {"prompt": prompt})
    
    def close(self):
        self.ws.close()

# 使用示例
client = PiAgentClient()
client.connect()

def on_event(event):
    if event["type"] == "message_delta":
        print(event["delta"], end="", flush=True)

client.on_event(on_event)
client.send("Hello, world!")
client.close()
```

---

## 项目结构

```
server/
├── src/
│   ├── api/
│   │   └── handler.ts      # JSON-RPC API 处理器
│   ├── config.ts           # 配置
│   ├── db/
│   │   ├── config.ts       # 数据库配置
│   │   ├── repository.ts   # 数据库仓库
│   │   └── schema.ts       # 表结构
│   ├── protocol/
│   │   └── jsonrpc.ts      # JSON-RPC 2.0 实现
│   ├── worker/
│   │   ├── agent.ts        # Agent Session (Mock)
│   │   ├── messages.ts     # Worker 消息协议
│   │   └── pool.ts         # Worker 池
│   ├── ws/
│   │   └── server.ts       # WebSocket 服务器
│   └── utils/
│       └── logger.ts       # 日志工具
└── tests/
    └── unit/               # 单元测试
```

---

## 开发

### 添加新 API Method

1. 在 `src/api/handler.ts` 添加 handler：

```typescript
const methodHandlers: Record<string, Handler> = {
  // ... existing handlers
  'my.method': async (request, context) => {
    // 处理逻辑
    return createResponse(request.id, { result: 'ok' });
  },
};
```

2. 添加测试：

```typescript
// tests/unit/api/handler.test.ts
it('should handle my.method', async () => {
  // ...
});
```

### 添加真实 Agent 支持

在 `src/worker/agent.ts` 中替换 `createMockAgentSession` 为真实实现：

```typescript
import { createAgentSession } from '@earendil-works/pi-coding-agent';

export async function createAgentSession(options: SessionOptions): Promise<IAgentSession> {
  const session = await createAgentSession({
    cwd: options.cwd,
    authStorage: new InMemoryAuthStorage('your-api-key'),
  });
  
  return {
    // 实现 IAgentSession 接口
  };
}
```

---

## 项目状态

| 项目 | 状态 |
|------|------|
| **代码** | ✅ M0-M7 全部完成 |
| **测试** | ✅ 120 tests passing |
| **文档** | ✅ README + API + Architecture + Milestone |

### 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Node.js (>=20) |
| 语言 | TypeScript |
| WebSocket | `ws` |
| 数据库 | Knex.js + MySQL/SQLite |
| 测试 | Vitest |
| Agent SDK | `@earendil-works/pi-coding-agent` (Mock) |

## License

MIT
