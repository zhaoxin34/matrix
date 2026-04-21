# 前后端API接口规范

## 设计目标

- 前后端统一
- 可自动化（生成 SDK / 测试 / Mock）
- 可观测（日志 / trace / debug）
- 对 AI 友好（Claude / Agent 能理解并调用）

## 核心响应结构

### 标准响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "traceId": "string",
  "timestamp": 1713700000000
}
```

### 字段定义（严格规范）

| 字段      | 类型   | 必填 | 含义                       |
| --------- | ------ | ---- | -------------------------- |
| code      | int    | 是   | 业务状态码（0 = 成功）     |
| message   | string | 是   | 给人类 / AI 的错误说明     |
| data      | any    | 否   | 返回数据                   |
| traceId   | string | 是   | 请求链路ID（用于排查问题） |
| timestamp | number | 是   | 服务端时间戳（毫秒）       |

### :white_check_mark: 成功示例

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 123,
    "name": "Alice"
  },
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

### :x: 失败示例

```json
{
  "code": 2001,
  "message": "User not found",
  "data": null,
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

## 错误码体系

### 设计规则

| 范围      | 用途     |
| --------- | -------- |
| 0         | 成功     |
| 1000-1999 | 通用错误 |
| 9000-9999 | 系统错误 |

### 错误码示例

| 错误码 | 说明                  |
| ------ | --------------------- |
| 0      | OK                    |
| 1001   | Invalid Parameter     |
| 1002   | Unauthorized          |
| 2001   | User Not Found        |
| 2002   | User Already Exists   |
| 3001   | Order Not Found       |
| 9001   | Internal Server Error |

