# Request Logger API - Backend Development Handoff

## 概述

Request Logger 是一个 Chrome 扩展功能模块，用于拦截页面中的 XHR/fetch 请求，并将请求数据实时转发到后端服务。

## 接口端点

```
POST {backendUrl}/api/v1/neo-agents/request-logger
```

其中 `backendUrl` 是在 extension sysconfig 中配置的后端地址，默认为 `http://localhost:8000`。

## 请求格式

### Headers

```http
Content-Type: application/json
```

### Body

```json
{
  "event": "start" | "complete" | "error",
  "request": {
    "id": "abc123xy",
    "timestamp": 1720646400000,
    "type": "fetch" | "xhr",
    "method": "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS",
    "url": "https://api.example.com/users/123",
    "requestHeaders": {
      "Content-Type": "application/json",
      "Authorization": "Bearer xxx"
    },
    "requestBody": "{\"name\":\"test\"}",
    "status": 200,
    "statusText": "OK",
    "responseHeaders": {
      "Content-Type": "application/json"
    },
    "responseBody": "{\"id\":123,\"name\":\"test\"}",
    "duration": 150,
    "error": null
  },
  "sessionId": "optional-session-id",
  "tabId": "optional-tab-id"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| event | string | 是 | 事件类型：`start`（请求开始）、`complete`（请求完成）、`error`（请求失败） |
| request | object | 是 | 请求详情，见下方表格 |
| sessionId | string | 否 | 扩展会话 ID，用于关联多个请求 |
| tabId | string | 否 | Chrome Tab ID |

#### request 对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 请求唯一 ID（格式：`[a-z0-9]{12}`） |
| timestamp | number | 是 | Unix 时间戳（毫秒） |
| type | string | 是 | 请求类型：`fetch` 或 `xhr` |
| method | string | 是 | HTTP 方法（大写） |
| url | string | 是 | 完整请求 URL |
| requestHeaders | object | 是 | 请求头（键值对） |
| requestBody | string | 否 | 请求体（已字符串化） |
| status | number | 否 | 响应状态码（`complete` 事件时有） |
| statusText | string | 否 | 响应状态文本（`complete` 事件时有） |
| responseHeaders | object | 否 | 响应头（`complete` 事件时有） |
| responseBody | string | 否 | 响应体（已字符串化，`complete` 事件时有） |
| duration | number | 否 | 请求耗时毫秒数（`complete`/`error` 事件时有） |
| error | string | 否 | 错误信息（`error` 事件时有） |

## 响应格式

### 成功响应

```json
{
  "success": true,
  "received": true
}
```

### 错误响应

```json
{
  "success": false,
  "error": "Invalid request body"
}
```

## 功能需求

### 1. 数据接收与存储

- 接收 POST 请求的 JSON 数据
- 验证必填字段
- 可选：将数据存储到数据库或消息队列
- 可选：支持实时推送（如 WebSocket）给前端 UI

### 2. 数据处理

- 支持高并发请求（每个用户操作可能产生多个 XHR/fetch）
- 可选：去重（根据 `id` 字段）
- 可选：聚合分析（统计 API 调用次数、耗时等）

### 3. 配置

- 支持配置 webhook URL（在扩展端配置）
- 当前配置：`http://localhost:8000/api/v1/neo-agents/request-logger`

## 使用场景

1. **调试**：开发者在 DevTools 中查看 API 调用详情
2. **监控**：监控页面中所有 API 请求
3. **自动化测试**：捕获并验证 API 请求/响应
4. **日志分析**：收集用户操作产生的 API 调用日志

## 扩展端实现参考

- `browser-tool/src/browser-tool/request-logger/` - 核心拦截模块
- `extension/src/request-logger/http-consumer.ts` - 待实现（调用本接口）

## 联系

如有问题，请联系 neo-agents 前端开发者。
