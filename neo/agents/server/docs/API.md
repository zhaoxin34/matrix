# API 文档

## 概述

Pi Agent Server 使用 JSON-RPC 2.0 协议通过 WebSocket 进行通信。

**基础 URL**: `ws://localhost:8080`

**认证**: 通过 URL 参数 `?session=<session-id>` 或创建新 Session

---

## 连接

```javascript
// 无 Session (自动创建)
const ws = new WebSocket('ws://localhost:8080');

// 带 Session ID (恢复会话)
const ws = new WebSocket('ws://localhost:8080?session=your-session-id');
```

---

## Session 方法

### session.create

创建新 Session。

**参数:**
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| cwd | string | 否 | 工作目录，默认 `/tmp` |
| thinkingLevel | string | 否 | 思考深度: off/minimal/low/medium/high/xhigh，默认 medium |
| modelId | string | 否 | 模型 ID (真实 SDK) |

**返回:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "created"
}
```

---

### session.send

发送 Prompt 给 Agent。

**参数:**
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| prompt | string | 是 | 要发送给 Agent 的指令 |
| images | Image[] | 否 | 图片 (未来支持) |

**返回:**
```json
{
  "status": "processing",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### session.steer

在流式执行中重定向 Agent。

**要求:** Session 必须在流式执行中 (isStreaming = true)

**参数:**
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| text | string | 是 | 新的指令 |

**返回:**
```json
{
  "status": "steered"
}
```

**错误:**
- `-32002`: Session 不在流式状态

---

### session.followUp

在当前执行完成后追加指令。

**参数:**
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| text | string | 是 | 追加的指令 |

**返回:**
```json
{
  "status": "queued"
}
```

---

### session.abort

中止当前执行。

**返回:**
```json
{
  "aborted": true
}
```

---

### session.info

获取 Session 状态信息。

**返回:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "isStreaming": false,
  "messageCount": 4,
  "cwd": "/tmp",
  "modelId": null,
  "thinkingLevel": "medium"
}
```

---

### session.destroy

销毁 Session，释放资源。

**返回:**
```json
{
  "status": "destroyed"
}
```

---

## 事件

Agent 运行时推送的事件，通过 `agent.event` 方法接收：

```json
{
  "jsonrpc": "2.0",
  "method": "agent.event",
  "params": { ... }
}
```

### 事件类型

#### agent_start

Agent 开始处理请求。

```json
{
  "type": "agent_start"
}
```

#### message_start

新消息开始。

```json
{
  "type": "message_start",
  "messageId": "msg-1",
  "role": "assistant"
}
```

#### message_delta

文本增量输出。

```json
{
  "type": "message_delta",
  "messageId": "msg-1",
  "delta": "Hello"
}
```

#### message_thinking

思考过程输出。

```json
{
  "type": "message_thinking",
  "messageId": "msg-1",
  "delta": "Let me think about this..."
}
```

#### message_end

消息结束。

```json
{
  "type": "message_end",
  "messageId": "msg-1"
}
```

#### tool_start

工具调用开始。

```json
{
  "type": "tool_start",
  "toolCallId": "tool-1",
  "name": "bash",
  "args": { "command": "ls -la" }
}
```

#### tool_update

工具输出。

```json
{
  "type": "tool_update",
  "toolCallId": "tool-1",
  "output": "total 64"
}
```

#### tool_end

工具调用结束。

```json
{
  "type": "tool_end",
  "toolCallId": "tool-1",
  "isError": false
}
```

#### queue_update

队列更新。

```json
{
  "type": "queue_update",
  "steer": "Stop, do something else"
}
```
或
```json
{
  "type": "queue_update",
  "followUp": "Also do this"
}
```

#### agent_end

Agent 处理完成。

```json
{
  "type": "agent_end",
  "messages": [
    { "id": "msg-1", "role": "user", "content": "..." },
    { "id": "msg-2", "role": "assistant", "content": "..." }
  ]
}
```

---

## 错误处理

### 错误响应格式

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32002,
    "message": "Session is currently streaming",
    "data": null
  },
  "id": 1
}
```

### 错误码

| 代码 | 名称 | 描述 |
|------|------|------|
| -32700 | ParseError | JSON 解析失败 |
| -32600 | InvalidRequest | 无效的请求格式 |
| -32601 | MethodNotFound | 方法不存在 |
| -32602 | InvalidParams | 无效的参数 |
| -32603 | InternalError | 服务器内部错误 |
| -32001 | SessionNotFound | Session 不存在 |
| -32002 | SessionBusy | Session 正忙 |
| -32003 | AgentError | Agent 执行错误 |

---

## 示例

### 完整对话流程

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  // 1. 创建 Session
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    method: 'session.create',
    params: { cwd: '/workspace' },
    id: 1
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.method === 'agent.event') {
    // 处理事件
    const event = msg.params;
    switch (event.type) {
      case 'agent_start':
        console.log('Agent started');
        break;
      case 'message_delta':
        process.stdout.write(event.delta);
        break;
      case 'agent_end':
        console.log('\nDone!');
        break;
    }
  } else if (msg.id) {
    // 处理响应
    if (msg.error) {
      console.error('Error:', msg.error.message);
    } else {
      console.log('Response:', msg.result);
    }
  }
};
```

---

## 批量请求

```json
[
  { "jsonrpc": "2.0", "method": "session.create", "params": {}, "id": 1 },
  { "jsonrpc": "2.0", "method": "session.send", "params": { "prompt": "Hello" }, "id": 2 }
]
```

响应:
```json
[
  { "jsonrpc": "2.0", "result": { "sessionId": "...", "status": "created" }, "id": 1 },
  { "jsonrpc": "2.0", "result": { "status": "processing" }, "id": 2 }
]
```
