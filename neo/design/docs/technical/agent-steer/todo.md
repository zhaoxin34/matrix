# Recording 模块实施细节

> 本文件是 [recording.md](./recording.md) 的实施补充。所有 API 路径、消息类型、字段命名、步骤清单都集中在这里，避免设计文档被实现细节污染。

---

## 1. 后端 API

### 1.1 创建 Recording

```
POST /api/v1/workspaces/{workspaceCode}/recordings
Headers: Authorization: Bearer {token}
         Content-Type: application/json
Body:    { name, source: "agent", enter_url? }
Response: ApiResponse<{ uid, name, status, ... }>
```

### 1.2 上传 Segment bytes

```
PUT /api/v1/workspaces/{workspaceCode}/recordings/{recordingUid}/segments/{segmentUid}/bytes
Headers: Authorization: Bearer {token}
         Content-Type: application/json
Body:    <rrweb events JSON 数组字符串>
Response: ApiResponse<{ storage_key, size }>
```

> `storage_key` 由后端确定性生成，**前端不要拼**。

### 1.3 注册 Segment

```
POST /api/v1/workspaces/{workspaceCode}/recordings/{recordingUid}/segments
Headers: Authorization: Bearer {token}
         Content-Type: application/json
Body:    {
    start_time: ISO8601,
    end_time: ISO8601,
    page_urls: string[],
    storage_key: string,
    size: number
}
Response: ApiResponse<{ uid, sequence }>
```

> `sequence` 由后端自动分配，前端不传。

### 1.4 完成 Recording

```
POST /api/v1/workspaces/{workspaceCode}/recordings/{recordingUid}/complete?exit_url=...
Headers: Authorization: Bearer {token}
Response: ApiResponse<RecordingResponse>
```

### 1.5 接口约束

- `segmentUid` 必须满足 `^[A-Za-z0-9_-]{1,128}$`，长度 1-128。
- 一次 segment body 不超过 20MB（后端限制）。
- 401 → token 过期，CS 触发重新登录流程。

---

## 2. 消息类型

### 2.1 命令（Popup → CS）

| type | payload | 说明 |
|------|---------|------|
| `recording.start` | — | 用户点击"开始" |
| `recording.pause` | — | 用户点击"暂停" |
| `recording.resume` | — | 用户点击"继续" |
| `recording.stop` | — | 用户点击"停止" |

### 2.2 状态（CS → Popup）

| type | payload |
|------|---------|
| `recording.state-update` | `{ status, recordingUid, segmentCount, duration, currentSegmentUid }` |

CS 推状态的时机：
- 开始成功 / 失败
- 每次切 segment 完成
- 暂停 / 恢复
- 停止完成

---

## 3. Chrome Storage 键

| key | 类型 | 说明 |
|-----|------|------|
| `recording.recordingUid` | `string \| undefined` | 当前活跃 recording。undefined = idle。 |
| `recording.lastStartAt` | `number` | 本次录制的开始时间戳（用于生成 name） |
| `auth.token` | `string` | 已有 |
| `auth.userInfo` | `UserInfo` | 已有（含 workspaceCode） |

---

## 4. 字段命名约定

| 字段 | 类型 | 说明 |
|------|------|------|
| `recordingUid` | string (UUID) | 后端签发 |
| `segmentUid` | string (UUID) | 浏览器生成，满足 `^[A-Za-z0-9_-]{1,128}$` |
| `sequence` | number | 后端分配 |
| `name` | string | 格式 `录制 YYYY-MM-DD HH:mm:ss` |
| `pageUrls` | string[] | segment 内访问过的 URL |

---

## 5. Segment 切分：实现细节

### 5.1 伪代码

```
function finishSegment(opts: { isLast: boolean, nextAction: 'continue' | 'pause' | 'stop' }):
    // 1. 停止 rrweb，拿到当前 buffer
    events = rrweb.stop()

    // 2. 生成 segmentUid
    segmentUid = uuid()

    // 3. 上传 bytes
    await fetch(PUT /recordings/{uid}/segments/{segmentUid}/bytes, events)

    // 4. 注册 segment
    await fetch(POST /recordings/{uid}/segments, {
        start_time, end_time, page_urls, storage_key, size
    })

    // 5. 清空 buffer
    rrweb.clear()

    // 6. 后续动作（由触发时机决定）
    if opts.nextAction == 'continue':
        rrweb.start()      // 启动新 segment
    else if opts.nextAction == 'pause':
        setState('paused')
    else if opts.nextAction == 'stop':
        await fetch(POST /recordings/{uid}/complete)
        clearStorage()
        setState('idle')
```

### 5.2 关键不变量

- `rrweb.stop()` → `rrweb.start()` 之间**不能有空隙**：用户视角无感知。
- 上传失败时：当前 segment 数据丢失，下一个 segment 正常开始。**不重试**。
- segment buffer 始终在内存，**不在 IndexedDB**。

---

## 6. 实施步骤

### 阶段 1：清理
- [ ] Popup 移除 `paused/pending/uploading/success/error` 视图
- [ ] CS 移除 IndexedDB 读写代码
- [ ] SW 移除上传逻辑，仅保留最薄壳

### 阶段 2：核心 API
- [ ] CS 实现 `finishSegment()` 统一函数
- [ ] CS 实现 3 个变体：`finishAndContinue` / `finishAndPause` / `finishAndStop`
- [ ] 接入后端 4 个 API（创建 / 上传 bytes / 注册 / complete）

### 阶段 3：触发点
- [ ] 10 分钟定时器
- [ ] 用户命令（start/pause/resume/stop）
- [ ] `visibilitychange` 监听
- [ ] `chrome.tabs.onActivated` 兜底
- [ ] `chrome.idle` 监听（60s）

### 阶段 4：生命周期
- [ ] 开始录制（创建 recording + 写 storage）
- [ ] 停止录制（complete + 清 storage）
- [ ] 重启续传（popup 启动检测 storage + 自动接续）

### 阶段 5：清理
- [ ] 移除旧 IndexedDB schema
- [ ] 移除旧消息类型
- [ ] 移除旧测试用例
- [ ] 更新 [index.md](./index.md) 的整体架构图

---

## 7. 验收场景

| # | 场景 | 期望 |
|---|------|------|
| 1 | 点击"开始" | 后端有 recording，rrweb 启动，状态 recording |
| 2 | 等待 10 分钟 | 切 segment，后端有 segment 记录 |
| 3 | 切 tab 走开 1 分钟后回 tab | 切 segment，回到 tab 启动新 segment |
| 4 | 关闭浏览器，重开 | popup 启动时进入 recording，自动接续原 recording |
| 5 | 暂停 | 切 segment，停在 paused |
| 6 | 恢复 | 启动新 segment，状态 recording |
| 7 | 停止 | 切最后 segment + complete + 回到 idle |
| 8 | 浏览器不活跃 60s | 切 segment |
| 9 | 浏览器异常关闭 + 重启 | 自动接续，只丢最后一段 |
| 10 | 录制时 token 过期 | 触发重新登录 |

---

## 8. 模块文件清单

```
src/recording/
├── index.ts              主入口
├── popup/
│   ├── RecordingUI.tsx
│   ├── IdleView.tsx
│   ├── RecordingView.tsx
│   └── PausedView.tsx
├── cs/
│   ├── recorder.ts       rrweb 包装、segment buffer
│   ├── lifecycle.ts      finishSegment + 3 个变体
│   ├── api.ts            后端 API 调用
│   ├── triggers.ts       visibilitychange / tabs / idle 监听
│   └── messages.ts       消息处理
├── sw/
│   └── router.ts         极薄壳
├── session/
│   └── storage.ts        recordingUid 读写
└── auth/
    └── iframe-bridge.ts  已有
```

---

## 9. 后续可选（不在 v2 范围）

- IndexedDB 兜底（浏览器异常关闭时不丢最后一段）。
- 录制异常自动重试。
- 多录像并行。
- 标注。
