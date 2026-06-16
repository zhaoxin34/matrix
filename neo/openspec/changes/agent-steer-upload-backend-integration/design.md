# Design: agent-steer 录制上传到 Neo 后端

## Context

agent-steer 扩展的录制数据由 `public/recorder.js`（注入到 MAIN world）写入 page-origin IndexedDB `neo-agent-recordings` 数据库的 `segments` 和 `sessions` store。

Chrome 扩展世界隔离规则（精确版）：

```
┌─────────────────────────────────────────────────────────────────┐
│  Page MAIN world (recorder.js)                                  │
│   IndexedDB origin: <page origin>                               │
│   writes: segments + sessions                                    │
└─────────────────────────────────────────────────────────────────┘
                       ↕ 共享 IndexedDB ✅
┌─────────────────────────────────────────────────────────────────┐
│  Content Script ISOLATED world (cs/*.ts)                        │
│   IndexedDB origin: <page origin>  ← 跟 MAIN world 一样!        │
│   cs/db/indexeddb.ts 可以直接 getUnsyncedSegments() ✅           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Service Worker (sw/communicator.ts)                            │
│   IndexedDB origin: chrome-extension://<ext-id>/  🚫 看不到上面 │
└─────────────────────────────────────────────────────────────────┘
```

**关键发现**：Content Script ISOLATED world 与 page MAIN world 共享 page-origin IndexedDB。这已经在 e2e spike 中验证（CS 直接 `getUnsyncedSegments()` 读到了 recorder.js 写的数据，端到端跑通）。

## Goals / Non-Goals

**Goals:**
- 用户在 Popup 点"上传" → CS 读 IndexedDB → 调后端 API → 进度推送 → 成功后跳转回放
- 跨 tab 多 origin：每个 tab 独立上传（每次上传当前 tab 的 segments）

**Non-Goals:**
- 不实现"批量上传所有 tab 的未上传 segments"（用户需在每个 tab 单独点上传）
- 不实现"跨 tab 同一个 session 连续录制"（当前 recorder.js 每个 tab 独立 session）
- 不实现录制中的实时上传（每 10 分钟一段切 segment 后自动上传）—— 只做"用户主动点上传"
- 不实现录制标注功能（设计文档标注为 TODO 暂时不做）
- 不改后端 recording API schema（已完整）

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Chrome 扩展: agent-steer                          │
│                                                                          │
│  Popup (React)                                                            │
│    ├─ IdleView / RecordingView / PausedView / PendingView / UploadInput   │
│    ├─ useUploadState: 监听 chrome.runtime.onMessage 'upload-progress'     │
│    └─ SuccessView.onViewPlayback: → 跳到 Neo Frontend 回放页             │
│                       ▲                  │                                │
│                       │ cs→popup         │ popup→sw→cs                    │
│                       │ upload-progress  │ upload-cmd                     │
│                       │                  ▼                                │
│  Content Script (ISOLATED) ◀─────── Service Worker                       │
│    ├─ commands.handleUpload()          ├─ startUpload(name, wsCode)      │
│    │  ├─ db.getUnsyncedSegments()       │   └─ tabs.sendMessage(tabId,  │
│    │  ├─ POST /recordings                │      {command:"upload",      │
│    │  ├─ for each segment:               │       payload:{...}})         │
│    │  │   PUT /segments/{uid}/bytes     │                               │
│    │  │   POST /segments                 │                               │
│    │  └─ POST /complete                  │                               │
│    └─ state.pushUploadProgress() ──────┘                                │
│                       │                                                   │
│                       │ fetch + Bearer token                             │
└───────────────────────┼──────────────────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              Neo Backend (FastAPI, port 8000)                            │
│                                                                          │
│  POST   /api/v1/workspaces/{code}/recordings                  ✅ 已实现   │
│  PUT    /api/v1/workspaces/{code}/recordings/{uid}/segments/  ✅ 已实现   │
│           {segUid}/bytes  (rustfs CORS bypass)                            │
│  POST   /api/v1/workspaces/{code}/recordings/{uid}/segments   ✅ 已实现   │
│  POST   /api/v1/workspaces/{code}/recordings/{uid}/complete   ✅ 已实现   │
│                                                                          │
│  CORS: allow_origins=["*"], allow_credentials=False                      │
└──────────────────────────────────────────────────────────────────────────┘
```

## Decisions

### Decision 1: Content Script 主导上传（方案 A，已 spike 验证）

**选择**: CS 读 IndexedDB + 调 fetch + 推送 progress；SW 只做命令路由

**理由**:
- CS ISOLATED world 直接共享 page-origin IndexedDB（spike 验证通过）
- SW 调 fetch 会被 CORS 拒绝（chrome-extension:// origin），CS 不会
- 改动最小：CS 加 handleUpload，SW 加转发，UI 加监听

**权衡**:
- 上传期间 tab 不能关（CS 没了就中断）—— 接受，MVP 不做后台保活
- 跨 origin 录制只能各自上传 —— 接受，跨 tab 多 origin 是 MVP 边界

### Decision 2: 消息协议扩展

**Popup → SW**: `startUpload(name, workspaceCode, backendUrl?)` 保持原 API
**SW → CS**: `recording-cmd` 新增 `command: "upload"`，payload 携带 `name/token/workspaceCode/backendUrl`
**CS → Popup/SW**: 新增 `cs→popup` `type: "upload-progress"`，payload 携带 `{taskId, status, progress, currentSegment, totalSegments, recordingUid?, error?}`

**理由**:
- 复用现有 `recording-cmd` 通道（不引入新的 message 类型枚举值）
- 复用现有 `cs→popup` 方向（不引入新的方向枚举）
- progress 通过 push 推（不是轮询）—— 实时性更好，避免 SW 内存 progress 不同步

### Decision 3: 后端 CORS 放宽

**选择**:
```python
allow_origins=["*"],
allow_credentials=True,
```

**理由**:
- agent-steer 跨 tab 调 fetch 时需要 CORS 通杀（任何 tab origin），`allow_origins=["*"]` 是最简方式
- 前端 Neo Frontend 用 `credentials: "include"` + cookie 鉴权（`lib/api/auth.ts` 不带 Authorization header），所以 `allow_credentials` 必须 True
- **Starlette CORSMiddleware 在 `allow_credentials=True` + `allow_origins=["*"]` 时会自动 echo 实际 origin**（不是发 `*`），从而绕开浏览器的"CORS 不能用 * with credentials"限制
- 这样同时满足：agent-steer 跨 origin + 前端带 cookie

**安全论证**: 安全不靠 CORS 隔离（防不了 XSS 等），靠 token 鉴权 + 后端业务校验

### Decision 4: 跨 tab 多 origin 上传策略

**当前**: 每次上传只能上传当前激活 tab 的 segments

**理由**:
- IndexedDB 是 page-origin 隔离的，CS_A 看不到 CS_B 的数据
- 一个 tab 的 CS 是单一实例，只能 fetch 自己 origin 的数据
- MVP 接受"用户在每个 tab 单独点一次上传"

**Future work**（不在本次 scope）:
- SW 遍历所有 tab，触发每个 tab 的 CS 独立上传
- Popup 显示"X 个 tab 有未上传数据"聚合提示（需要 SW 主动轮询）

### Decision 5: 上传成功后清理 IndexedDB

**选择**: 上传成功后调用 `db.markSegmentSynced()` 标记所有上传的 segments 为 synced；保留 local 数据不删除

**理由**:
- 设计文档说 `clear` 是用户主动操作（不可恢复），不能自动清
- 标记 synced 后，popup 重启时通过 `getUnsyncedSegments()` 不会重复上传
- 用户可以手动点"清除"删除本地数据

**Future work**（不在本次 scope）:
- 加配置项"上传成功后自动清除本地"
- 区分 "synced 但未清除" 状态，UI 显示"已上传但本地仍保留"

### Decision 6: 上传失败的 segment 标记

**选择**: 上传过程中如果某个 segment 失败，标记 `synced=false` 但不重试；UI 显示失败状态

**理由**:
- MVP 不实现断点续传
- 失败的 segment 保留在 IndexedDB，下次用户点"上传"时重新尝试
- 进度推送 `status: "failed"` 带 error 字段

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Tab 在上传过程中关闭 | 上传中断，失败的 segment 保留本地，下次重新上传 |
| Token 过期 | CS 接到 401 后推送 `status: "failed"` 带 error="token expired"，UI 提示重新登录 |
| 多个 segment 部分失败 | 当前上传整体失败（fail-fast），未来支持 per-segment 失败重试 |
| IndexedDB 数据被损坏 | `getUnsyncedSegments` 内部已做 schema 校验（spike 验证） |
| recorder.js schema 变化 | `db/indexeddb.ts` 的 `onupgradeneeded` 已实现版本迁移 |

## Open Questions

1. **Workspace "default" 的数据**: 后端 `workspace_members` 表对 user 3 是空的（owner_id=3 但 member_count=0），403 Not a workspace member。是否需要 migration seed？
   - 倾向: 写一个小 migration 或 startup script 自动给 owner 加 member 记录
   - 决定: 本次 scope 加一个 Alembic migration

2. **Recording name 默认值**: 如果用户没输入名称，UI 默认用什么？
   - 倾向: `recording-{timestamp}` 格式（如 `recording-2026-06-15T22:30:00Z`）

3. **upload-cmd 重试机制**: SW 转发 upload-cmd 到 CS 失败时（如 CS 还没初始化）怎么办？
   - 倾向: 当前不做重试，UI 显示"录制页面未激活，请在录制 tab 重试"