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
| `recording.state-query` | — | popup 重开后主动查询当前状态 |

### 2.2 状态（CS → Popup）

| type | payload |
|------|---------|
| `recording.state-update` | `{ status, recordingUid, segmentCount, duration, currentSegmentUid }` |
| `recording.state-query` | CS 收到后立即回推 `state-update` |

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
- [x] Popup 移除 `paused/pending/uploading/success/error` 视图（v2 UI 替代 v1 UI，commit 64681c40）
- [ ] CS 移除 IndexedDB 读写代码（推迟到阶段 5 统一清理）
- [ ] SW 移除上传逻辑，仅保留最薄壳（推迟到阶段 5 统一清理）

### 阶段 2：核心 API
- [x] CS 实现 `finishSegment()` 统一函数（commit 6bbeaa24）
- [x] CS 实现 3 个变体：`finishAndContinue` / `finishAndPause` / `finishAndStop`（commit 6bbeaa24）
- [x] 接入后端 4 个 API（创建 / 上传 bytes / 注册 / complete）（commit 6bbeaa24）

### 阶段 3：触发点
- [x] 用户命令（start/pause/resume/stop）— 阶段 3a（commit 86c3989d）
- [x] rrweb 集成（start/pause 时启动/停止 rrweb，emit 到 events buffer）— 阶段 3c（commit 1317dd65）
- [x] 10 分钟定时器— 阶段 3c
- [x] `visibilitychange` 监听（切走切 segment / 切回启动新 segment）— 阶段 3c
- [x] `chrome.idle` 监听（60s）— 阶段 3c → 改为 setInterval 方案（无 API 依赖）
- [x] 重启续传（CS 启动检测 storage 自动接管）— 阶段 3c
- [ ] `chrome.tabs.onActivated` 兜底（v2 sw 起来后）— 阶段 5

### 阶段 4：生命周期
- [x] 开始录制（创建 recording + 写 storage）— 阶段 3c
- [x] 停止录制（complete + 清 storage）— 阶段 3c
- [x] 重启续传（popup 启动检测 storage + 自动接续）— 阶段 3c

### 阶段 5：清理
- [x] 移除旧 IndexedDB schema（commit f68d4290, v1 src/recording/db/ 全删）
- [x] 移除旧消息类型（commit f68d4290, v1 src/recording/messages.ts / storage.ts / storage.keys.ts 删）
- [x] 移除旧测试用例（commit f68d4290, e2e/upload.spec.ts 删）
- [x] 更新 [index.md](./index.md) 的整体架构图

### 阶段 6：补强项

阶段 1-5 覆盖了 v0.2.0 全部核心功能。补强项是**面向代码质量和健壮性**，不阻塞产品使用。

#### 6.1 token 过期 UX

- **现状**：v2 cs/api.ts 接到 401 抛 `Error: token expired`；v2 UI / popup 不感知
- **目标**：401 触发重新登录流程（弹 AuthRequiredView，提示用户去 Neo 重新登录）
- **涉及**：
  - v2 cs/commands.ts: 捕获 401 后 pushStateToPopup 带 `error: "auth_required"`
  - v2 ui/hooks/useRecordingState.ts: 监听 `error` 字段
  - v2 ui/RecordingUI.tsx: 检测到 error → 弹 AuthRequiredView
- **验收**：录制中 token 过期 → UI 提示重新登录 → 重登后继续录制

#### 6.2 trigger 日志

每个 trigger 触发时输出明确日志，方便调试：

| Trigger | 日志 | 成功 | 失败 |
|---------|------|------|------|
| 10 分钟定时器 | `[auto] 10分钟定时器触发` | `[auto] 10分钟自动分段完成` | `[auto] 10分钟自动分段失败` |
| 空闲检测 | `[auto] 空闲检测触发（已空闲 Ns）` | `[auto] 空闲分段完成` | `[auto] 空闲分段失败` |
| visibilitychange 切走 | `cutOnly: ok` | | `visibility hidden trigger failed` |
| visibilitychange 切回 | `takeover: 启动新 segment (切回)` | | `visibility visible trigger failed` |

- [x] 阶段 6.2 完成（commit 2911f19d）

#### 6.3 trigger 专项 e2e

- **现状**：recording.spec.ts 只覆盖主流程（start/pause/resume/stop），4 个 trigger 内部逻辑正确但无专项 e2e
- **目标**：为每个 trigger 加 e2e（e2e 端等 10 分钟不现实，需要可配置）
  - 10 分钟定时器：triggers.ts 把 TEN_MINUTES_MS 提到可配置（注入），e2e 改成 1s 验证切 segment 行为
  - visibilitychange：录制中切走 testPage，等几秒，验证 cs 切 segment + 切回后启动新 segment
  - chrome.idle：模拟 `chrome.idle.onStateChanged` 触发，验证切 segment
  - 重启续传：录制中关闭 popup，chrome.storage 有 recordingUid，验证下次启动时 cs 检测并接管
- **涉及**：
  - e2e/recording.spec.ts: 加 4 个 trigger 专项测试
  - 可选：triggers.ts 把 10 分钟等常量抽出来可配置

#### 6.4 `chrome.tabs.onActivated` 兜底

- **现状**：v2 cs 只用 `visibilitychange` 主信号；新窗口等边角 case 未覆盖
- **目标**：当 `chrome.tabs.onActivated` 触发时，SW 协调通知新的 active tab CS 接管
- **涉及**：
  - 需要新建 v2 sw/（极薄壳）：监听 onActivated，广播给 active tab CS
  - v2 cs 接收接管命令（如果 onActivated 切到别的 tab，旧 tab 切 segment；切到本 tab，本 tab 接管）
- **验收**：打开新窗口并切过去 → 旧 tab CS 切 segment → 新窗口 CS 接管
- **优先级**：低（visibilitychange 已覆盖大部分 case）

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
│   └── RecordingView.tsx（paused 在其内部按 status 条件渲染）
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
