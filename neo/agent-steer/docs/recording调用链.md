# 录像调用链

本文档描述录制功能从 UI 到 IndexedDB 存储的完整调用链。

## 1. 开始录像

```
IdleView (点击"开始录制"按钮)
  │
  ├─ onClick={onStartRecording}
  │
RecordingUI (usePopupController hook)
  │
  ├─ startRecording: async () => {
  │     await recordingActions.startRecording()
  │   }
  │
sw/communicator.ts
  │
  ├─ export async function startRecording()
  │     tabId = getCurrentTabId()
  │     sendRecordingCommandToCS(tabId, "start", requestId)
  │       └─ browser.tabs.sendMessage(tabId, {direction, type: "recording-cmd", command: "start"})
  │
cs/commands.ts
  │
  ├─ export async function handleCommand(params)
  │     switch(command) → case "start" → handleStart(params)
  │
  ├─ async function handleStart(params)
  │     sendToRRWeb("start")
  │
cs/rrweb.ts
  │
  ├─ export function sendToRRWeb(action, payload?)
  │     window.postMessage({
  │       source: "recorder-control",
  │       type: "request",
  │       id,
  │       action: "start"
  │     }, "*")
  │
public/recorder.js (注入到主世界)
  │
  ├─ window.addEventListener("message", ...)
  │     case "start" → startRecording()
  │
  ├─ async function startRecording()
  │     1. initDB() - 初始化 IndexedDB
  │     2. generateUUID() - 生成 sessionId
  │     3. saveToStore("sessions", session) - 保存 session
  │     4. createNewSegment() - 创建第一个 segment
  │     5. window.rrwebRecord.record({emit: handleEvent}) - 开始录制
  │     6. setInterval(flushSegment, 10分钟) - 启动定时刷新
  │     7. resolve({success: true, sessionId})
```

### 开始录像关键代码路径

```typescript
// Popup UI
IdleView.onClick → startRecording()
  ↓
// SW Communicator
sendRecordingCommandToCS(tabId, "start")
  ↓
// CS Commands
handleStart → sendToRRWeb("start")
  ↓
// CS RRWeb
window.postMessage({action: "start"})
  ↓
// Main World Recorder
startRecording() → initDB() + rrwebRecord.record()
```

---

## 2. 停止录像

```
PausedView / RecordingView (点击"停止录制"按钮)
  │
  ├─ onStop={stopRecording}
  │
RecordingUI (usePopupController hook)
  │
  ├─ stopRecording: async () => {
  │     await recordingActions.stopRecording()
  │   }
  │
sw/communicator.ts
  │
  ├─ export async function stopRecording()
  │     tabId = getCurrentTabId()
  │     sendRecordingCommandToCS(tabId, "stop", requestId)
  │
cs/commands.ts
  │
  ├─ async function handleStop(params)
  │     sendToRRWeb("stop")
  │
cs/rrweb.ts
  │
  ├─ export function sendToRRWeb(action)
  │     window.postMessage({
  │       source: "recorder-control",
  │       action: "stop"
  │     }, "*")
  │
public/recorder.js
  │
  ├─ case "stop" → stopRecording()
  │
  ├─ async function stopRecording()
  │     1. clearInterval(flushTimer) - 停止定时器
  │     2. flushSegment(true) - 强制保存最后一个 segment
  │     3. rrwebRecorder.stop() - 停止 rrweb 录制
  │     4. saveToStore("sessions", session{active: false}) - 更新 session 状态
  │     5. resolve({success: true})
```

---

## 3. 事件存储 (flushSegment)

录像数据通过 `flushSegment()` 函数保存到 IndexedDB：

```
handleEvent(event) - 每当有 rrweb 事件时
  │
  ├─ events.push(event) - 缓存到内存
  ├─ if(type===4) pageUrls.add(href) - 记录页面 URL
  │
flushSegment(force?)
  │
  ├─ if(!currentSegmentUid || (events.length===0 && !force)) return
  ├─ 构建 segment 对象
  │     {
  │       uid: currentSegmentUid,
  │       sessionId: currentSessionId,
  │       sequence: segmentSequence,
  │       events: JSON.stringify(events),
  │       pageUrls: [...],
  │       synced: false
  │     }
  ├─ saveToStore("segments", segment) - 保存到 IndexedDB
  ├─ window.postMessage("segment-saved") - 通知 CS 更新 segmentCount
  └─ createNewSegment() - 创建新 segment 继续录制
```

### 触发时机

| 触发条件 | force 参数 |
|----------|-----------|
| 每 10 分钟定时刷新 | false |
| 暂停录制时 | true |
| 停止录制时 | true |
| 内存中事件数>0 | false |

---

## 4. IndexedDB 结构

```
Database: neo-agent-recordings (版本 1)
│
├── ObjectStore: sessions
│   └─ keyPath: uid
│       ├─ uid: string (UUID)
│       ├─ startTime: number
│       ├─ endTime: number
│       ├─ active: boolean (录制中为 true)
│       └─ createdAt: number
│
└── ObjectStore: segments
    └─ keyPath: uid
        ├─ uid: string (UUID)
        ├─ sessionId: string
        ├─ sequence: number
        ├─ startTime: number
        ├─ endTime: number
        ├─ eventCount: number
        ├─ events: string (JSON)
        ├─ pageUrls: string[]
        ├─ synced: boolean (是否已上传)
        └─ createdAt: number
```

---

## 5. 关键文件

| 文件 | 职责 |
|------|------|
| `src/recording/ui/IdleView.tsx` | 空闲状态 UI，点击开始录制 |
| `src/recording/ui/hooks/usePopupController.ts` | Popup 控制器，组合各子 hook |
| `src/recording/sw/communicator.ts` | SW 通信层，转发录制命令到 CS |
| `src/recording/cs/commands.ts` | CS 录制命令处理 |
| `src/recording/cs/rrweb.ts` | CS 与 rrweb 的消息通信 |
| `public/recorder.js` | 主世界录制器，负责 rrweb 录制和 IndexedDB 存储 |