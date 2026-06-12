# Design: Agent Steer Recording

本文档描述 `agent-steer-recording` capability 的实现设计，对应 `proposal.md` 中识别的需求。设计聚焦"如何做"，需求规格见 `specs/agent-steer-recording/spec.md`。

## 1. 模块划分

chrome-extension 工程在 WXT 框架下新增以下模块：

```
chrome-extension/
├── entrypoints/
│   ├── popup/                  # 用户交互（5 状态 UI: Idle / Recording / Paused / Pending / Uploading / Success / Error）
│   │   ├── App.tsx             # 状态机驱动视图
│   │   ├── states/             # 每个状态一个组件
│   │   └── hooks/              # useRecordingState, useUpload, useSessionCoordinator
│   ├── content.ts              # content script 入口
│   └── background.ts           # service worker（跨 tab 协调中心）
├── src/
│   ├── recording/
│   │   ├── controller.ts       # 录制状态机（start/pause/resume/stop）
│   │   ├── segmenter.ts        # 10 分钟 + 切 tab 自动切分
│   │   ├── rrweb-runner.ts     # 封装 rrweb.record()
│   │   └── storage.ts          # IndexedDB 读写
│   ├── upload/
│   │   ├── service.ts          # 编排 4 步上传流程
│   │   ├── api-client.ts       # 调用后端 4 个 API
│   │   └── serializer.ts       # Segment 数据 → Blob / multipart
│   ├── session/
│   │   ├── coordinator.ts      # 跨 tab 协调：activeSessionId + activeRecorderTabId
│   │   └── storage.ts          # chrome.storage.session 读写封装
│   ├── messaging/
│   │   ├── protocol.ts         # AgentMessage 类型定义
│   │   ├── popup-client.ts     # popup 侧消息发送
│   │   └── content-handler.ts  # content script 侧消息路由
│   └── config/
│       └── settings.ts         # 读取 chrome.storage.local 配置
```

**关键变化（相对 v1 设计）**：
- 新增 `background.ts` 作为跨 tab 协调中心（之前只用 popup 直接和 content script 通信）
- 新增 `src/session/` 模块管理 `chrome.storage.session.activeSessionId` / `activeRecorderTabId`
- popup 增加 `Pending` 状态视图

## 2. 状态机

popup UI 由录制状态机驱动，状态转移图：

```
        ┌──────────┐
   ┌───→│   Idle   │←─────────────────────┐
   │    └──────────┘                      │
   │         │ start                      │
   │         ▼                            │
   │    ┌──────────┐  pause   ┌─────────┐ │
   │    │Recording │─────────→│ Paused  │ │
   │    └──────────┘          └─────────┘ │
   │         │ resume           │ upload  │
   │         └──────────────────┘         │
   │                       ┌──────────┐   │
   │                       │ Uploading│   │
   │                       └──────────┘   │
   │                          │           │
   │                success   │           │
   │                          ▼           │
   │                    ┌──────────┐       │
   │                    │ Success  │───────┘
   │                    └──────────┘
   │         stop (终止 session)   error
   │         │                    │
   │         ▼                    ▼
   │    ┌──────────┐         ┌──────────┐
   └────│ Discarded│         │  Error   │──→ retry / cancel
        └──────────┘         └──────────┘

        ┌──────────┐
        │ Pending  │ ←── 浏览器重启后 popup 检测到 IndexedDB 有未上传 segment
        └──────────┘
            │
            ├─→ 上传旧录像 → Uploading
            ├─→ 丢弃旧录像 → Idle（清空本地）
            └─→ 新开一段   → Recording（新 sessionId）
```

**关键不变量**：
- 全局同一时刻最多 1 个 active session
- 切 tab 不改变 popup 主状态（仍是 Recording/Paused），但 segment 计数会增加
- `Pending` 状态只在浏览器重启或新 tab 启动时可能出现（基于 IndexedDB 检测）
- `Pending` 状态下用户可选择"新开一段"——此时旧 unsynced segments **保留在 IndexedDB**，新 session 独立
- 任意非成功终态（Discarded / Error）保留 IndexedDB 数据由对应 transition 决定

## 3. 消息协议

复用 `message-communication` capability 的 `AgentMessage` 框架，本 capability 定义 `recording.*` 类型族。

### 3.1 协议类型

```typescript
// src/messaging/protocol.ts

// ===== Command types (popup → content script) =====
export type RecordingCommand =
  | { type: 'recording.start';  version: 1; direction: 'command'; timestamp: number; messageId: string; payload: { sessionId: string } }
  | { type: 'recording.pause';  version: 1; direction: 'command'; timestamp: number; messageId: string; payload: {} }
  | { type: 'recording.resume'; version: 1; direction: 'command'; timestamp: number; messageId: string; payload: {} }
  | { type: 'recording.stop';   version: 1; direction: 'command'; timestamp: number; messageId: string; payload: {} }
  | { type: 'recording.fetch';  version: 1; direction: 'command'; timestamp: number; messageId: string; payload: {} };

// ===== Event types (content script → popup) =====
export type RecordingEvent =
  | { type: 'recording.state'; version: 1; direction: 'event'; timestamp: number; messageId: string;
      payload: {
        isRecording: boolean;
        isPaused: boolean;
        duration: number;        // ms
        segmentCount: number;
        eventCount: number;
        sessionId: string;       // 新增：当前 tab 关联的 session
        isActiveRecorder: boolean; // 新增：当前 tab 是否为 active recorder
        error?: string;
      }}
  | { type: 'recording.data';  version: 1; direction: 'event'; timestamp: number; messageId: string;
      payload: {
        segments: Array<{
          uid: string;
          startTime: number;
          endTime: number;
          duration: number;
          eventCount: number;
          pageUrls: string[];
        }>;
      }};
```

### 3.2 传输通道

- popup → content script: `chrome.tabs.sendMessage(tabId, message)` 投递到指定 tab
- content script → popup: 通过 `chrome.runtime.sendMessage` 上行到 background，background 转发给指定 popup（如果有）
- background 作为消息总线，跨 tab 协调时是核心

### 3.3 错误响应

| 错误码 | 含义 | popup 行为 |
|--------|------|-----------|
| `NO_ACTIVE_TAB` | 没有当前激活标签页 | UI 显示"请先打开目标软件" |
| `ALREADY_RECORDING` | 当前 tab 已在录制中 | 忽略并刷新 state |
| `NOT_RECORDING` | 在 pause/resume 时 tab 未在录制 | 忽略并刷新 state |
| `STORAGE_FULL` | IndexedDB 配额满 | UI 提示"存储已满，请先上传已暂停录像" |
| `INTERNAL` | 其他未知错误 | UI 显示"录制出错，请重试" |

## 4. IndexedDB Schema

**直接复用** `indexeddb-storage` capability 已定义的 database（`neo-agent-recordings`）。本次新增一个 object store：`recording_segments`。

```
db: neo-agent-recordings (version 2)
├── recordings (已有，keyPath: id)
│   └── sessionId, events, startTime, endTime, createdAt, synced
└── recording_segments (新增，keyPath: uid)
    └── sessionId, sequence, startTime, endTime, events[], pageUrls[], createdAt
```

**索引**：
- `recording_segments.sessionId`（普通索引）—— 用于拉取某次录制的所有 segment
- `recording_segments.synced`（普通索引）—— 标记是否已上传（用于 Pending 状态检测）

**chrome.storage.session 字段**：
- `activeSessionId: string | null` —— 当前 active session 的 ID，全局唯一
- `activeRecorderTabId: number | null` —— 当前 active recorder 的 tab id

**chrome.storage.local 字段**：
- `upload_progress: { recordingUid, uploadedSegmentUids: string[] } | null` —— 上传进度，用于 idempotent retry

## 5. 分段策略（segmenter）

```typescript
// src/recording/segmenter.ts（伪代码）
class Segmenter {
  private events: rrwebEvent[] = [];
  private pageUrls: Set<string> = new Set();
  private currentStartTime: number;
  private timer?: number;

  start() {
    this.currentStartTime = Date.now();
    this.timer = setInterval(() => this.flush(), 10 * 60 * 1000);
  }

  pushEvent(evt: rrwebEvent) {
    this.events.push(evt);
    if (evt.type === 4) this.pageUrls.add(/* extract from event */);
  }

  async flush() {
    if (this.events.length === 0) return;
    const segment = { ... };
    await storage.segments.put(segment);
    this.events = [];
    this.pageUrls.clear();
    this.currentStartTime = Date.now();
  }

  // 新增：tab 切换时由 controller 主动调用
  async flushForTabSwitch() {
    await this.flush();
    // 切 tab 后由新 tab 的 controller 启动新 segment
  }
}
```

**关键点**：
- `pause()` 立即调用 `flush()`
- `resume()` 调用 `start()` 重启定时器，sequence 继续累加
- `stop()` 调用 `flush()` 收尾
- **新增** `flushForTabSwitch()`：旧 tab 切走时立即 flush 收尾当前 segment
- 录制过程中刷新页面或关闭标签，content script 卸载时通过 `beforeunload` 监听器紧急 flush 当前 segment
- 关闭 tab 不终止 session（除非是最后一个 tab）

## 6. 跨 Tab 协调机制

### 6.1 activeSessionId 管理

```
打开新 tab
  ↓
content script 启动
  ↓
读取 chrome.storage.session.activeSessionId
  ├── null → 无 active session，本 tab 是 Idle
  └── 有值 → 自己是 active session 的一部分
              ↓
              检查 chrome.storage.session.activeRecorderTabId
              ├── 等于自己 tabId → 启动 rrweb.record()（如果 paused 则不启动）
              ├── 不等于自己 → 不启动 rrweb，但订阅 activeRecorderTabId 变化
              └── null → 自己是第一个 tab，可作为 candidate
```

### 6.2 Tab 激活事件

监听 `chrome.tabs.onActivated`（在 background 中），当用户切到某 tab：

1. **旧 tab 的 content script**（通过 background 通知）：调用 `flushForTabSwitch()` 收尾 segment，停止 rrweb.record()
2. **新 tab 的 content script**：调用 `segmenter.start()` 开新 segment，启动 rrweb.record()
3. **background 更新** `chrome.storage.session.activeRecorderTabId = newTabId`

**注意**：实际实现中，content script 也可以监听 `visibilitychange` 事件自我感知失活，避免完全依赖 background 中转。但为了简化跨 tab 协调，初期实现采用 background 中转模式。

### 6.3 新 Tab 加载

新 tab 加载时，content script 启动逻辑（见 6.1）：

- 如果 `activeSessionId` 存在但 `activeRecorderTabId` 是 null（如之前的 recorder tab 关闭了）：
  - 本 tab 自动成为 active recorder
  - 启动 rrweb.record()，开新 segment
  - 更新 `activeRecorderTabId = self`

### 6.4 Recorder Tab 关闭

监听 `chrome.tabs.onRemoved`（在 background 中）：

- 如果关闭的 tab 是 `activeRecorderTabId`：
  - 清除 `activeRecorderTabId`（保留 `activeSessionId`）
  - 等待其他 tab 通过 visibilitychange/onActivated 接管

## 7. Pending 状态实现

### 7.1 触发条件

popup 启动时（mount 阶段）执行以下检测：

```typescript
// hooks/useRecordingState.ts 中
async function detectPendingState() {
  // 1. 查 IndexedDB：所有 unsynced segments
  const unsyncedSegments = await storage.segments.where('synced').equals(0).toArray();

  if (unsyncedSegments.length === 0) return null;

  // 2. 按 sessionId 分组
  const bySession = groupBy(unsyncedSegments, 'sessionId');

  // 3. 返回 Pending 数据：segment 数、总时长、最早开始时间
  return {
    sessions: Object.entries(bySession).map(([sessionId, segs]) => ({
      sessionId,
      segmentCount: segs.length,
      totalDuration: sum(segs.map(s => s.endTime - s.startTime)),
      earliestStart: min(segs.map(s => s.startTime)),
    })),
  };
}
```

### 7.2 UI 行为

Pending 状态显示：
- 总未上传 segment 数（合并所有 session）
- 总时长
- 最早开始时间
- 三个按钮：
  - **上传旧录像** → 选一个 session 进入上传流程（多 session 时弹出选择器）
  - **丢弃旧录像** → 二次确认 → 清空所有 unsynced segments → 回到 Idle
  - **新开一段** → 保留所有 unsynced segments → 用新 sessionId 开始录制

### 7.3 多 Session 选择器

如果 Pending 状态下有多个 unsynced session（用户开了多段又切回浏览器），上传按钮需要让用户选哪个 session 上传：

```
┌─────────────────────────────┐
│  ⏸ 检测到未上传录像          │
├─────────────────────────────┤
│  请选择要上传的录像：         │
│                              │
│  ○ Session 1 (3 segments)   │
│  ○ Session 2 (1 segment)    │
│                              │
│  [ 取消 ]  [ 上传所选 ]      │
└─────────────────────────────┘
```

## 8. 上传流程

与 v1 设计基本一致。关键点：

- 失败时保留 local data + upload_progress 用于重试
- 成功时清理 `deleteSegmentsBySession` 并删除对应 session 的 IndexedDB records

```typescript
async function uploadRecording(recordingName: string, workspaceCode: string, sessionId: string) {
  // 1. create recording
  // 2. for each segment: createSegment + presigned + PUT
  // 3. mark completed
  // 4. deleteSegmentsBySession(sessionId)
  // 5. clear upload_progress
}
```

## 9. 与已有 capability 的关系

| 现有 capability | 本 change 的关系 |
|----------------|------------------|
| `recording-upload` | **消费方**：调用其 4 个 API。本 change 不修改它 |
| `recording-management` | **消费方**：调用 `PUT /recordings/{uid}` 标记 completed。本 change 不修改它 |
| `recording-playback` | **无关**：popup "查看回放"按钮只是跳转 URL，不实现回放逻辑 |
| `rrweb-recording` | **无关**：它是后端的存储实现描述，本 change 是其潜在数据源，但不修改它 |
| `message-communication` | **复用**：使用其 `AgentMessage` 框架、MessageType 工厂、相关性 ID 机制 |
| `indexeddb-storage` | **复用**：使用其 `neo-agent-recordings` database，新增一个 object store |

## 10. 配置项

从 `chrome.storage.local` 读取：

```typescript
interface AgentSteerConfig {
  workspace_code: string;
  api_base_url: string;
  frontend_base_url: string;
}
```

**配置管理 UI 不在本 change 范围内**（属于 §2.1 系统配置管理项的另一个 change）。

## 11. 测试策略

| 测试类型 | 覆盖 | 工具 |
|---------|------|------|
| 单元测试 | segmenter 定时切分 / tab-switch 切分、storage CRUD、消息协议序列化、跨 tab 协调（mock chrome.storage.session） | Vitest |
| 集成测试 | popup ↔ content script ↔ background 消息往返、IndexedDB 真实读写、Pending 状态检测 | Vitest + fake-indexeddb + fake chrome.* API |
| e2e 测试 | 完整流程：开启 → 切 tab → 暂停 → 上传 → 后端落库 | Playwright（多 tab 场景） |
| 手动验证 | rrweb 录制结果在 neo frontend 回放是否正确 | 浏览器手测 |

**e2e 关键 case**：
1. **冒烟**：开启 → 等待 ≥10 秒 → 暂停 → 上传 → 验证后端 Neo DB 有对应 recording + segment
2. **切 tab 连续录制**：开启 → 录 5s → 切到另一 URL → 录 5s → 暂停 → 验证有 2 个 segment（按 sequence 排序），都在同一 sessionId 下
3. **新 tab 自动接管**：开启 → 关闭 recorder tab → 打开新 tab → 验证新 tab 自动开始录制（成为 activeRecorderTabId）
4. **浏览器重启 Pending**：开启 → 录一段 → 关闭浏览器 → 重开 → 点 popup → 看到 Pending 状态 → 上传 → 验证后端落库
5. **Pending 新开一段**：场景 4 后续 → 不上传，点"新开一段" → 验证旧 segment 保留，新 session 开始
6. **页面刷新 beforeunload**：开启 → 刷新页面 → 验证 segment 已落盘，重新开 popup 仍能看到
7. **长时间不操作**：开启 → 等 15 分钟（不操作）→ 验证仍在录制、segment 已切了 1 次（10 分钟时切）

## 12. Out of scope（不在本 change 范围）

- **长时间不操作自动暂停/停止/上传**：本 change 不实现。未来 change 考虑加入 idle 检测。
- **配置管理 UI**：popup 假设 `workspace_code` / `api_base_url` 等已配置。配置管理 UI 属于另一个 change。
- **录像标注/评论**：产品设计文档标注 TODO，本 change 不实现。
- **后端能力增强**：本次纯消费后端现有能力，不修改后端。
