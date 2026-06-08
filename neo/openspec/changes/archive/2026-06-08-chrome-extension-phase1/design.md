## Context

Neo Agent Chrome Extension 已在 `chrome-extension/` 目录下建立了 MV3 项目骨架。当前状态缺少核心功能实现。

**技术文档 3.1 定义的模块结构：**
```
extension/
├── src/
│   ├── background/         # Service Worker
│   │   ├── service-worker.ts    ← 已实现基础
│   │   ├── task-scheduler.ts    ← Phase 2
│   │   └── message-router.ts   ← Phase 2
│   ├── content/           # Content Script
│   │   ├── index.ts            ← 需增强
│   │   ├── recorder.ts         ← 新建
│   │   ├── operator.ts         ← 新建
│   │   ├── overlay.ts          ← 新建
│   │   └── iframe-manager.ts   ← 新建
│   └── shared/            # 共享类型
│       └── types.ts            ← 需扩展
```

**约束**：
- 必须使用 Manifest V3（MV3）
- 必须支持 Chrome 浏览器
- 离线优先，联网后同步
- iframe 内嵌 Neo 前端（端口 3300）

## Goals / Non-Goals

**Goals:**
- 实现 Content Script 模块化拆分（recorder, operator, overlay, iframe-manager, storage）
- 实现基于 rrweb 的用户操作录制功能
- 实现 Neo 前端 iframe 的动态嵌入和模式切换
- 实现基于 IndexedDB 的本地录制数据存储
- 实现 Extension 与 iframe 的双向消息通信
- 添加录制状态可视化指示器

**Non-Goals:**
- 不实现 Background 的 task-scheduler（Phase 2）
- 不实现 Background 的 message-router（Phase 2）
- 不实现后端 API 对接（Phase 2）
- 不实现引导模式的遮罩同步（Phase 2）
- 不实现主动模式的任务调度（Phase 2）
- 不实现用户认证（Phase 1.3）

## Decisions

### Decision 1: Content Script 模块拆分

**选择**: 按照职责拆分为 5 个模块文件

| 模块 | 职责 | 文件 |
|------|------|------|
| recorder | rrweb 录制引擎封装 | `src/content/recorder.ts` |
| operator | DOM 操作执行 | `src/content/operator.ts` |
| overlay | Shadow DOM 遮罩和指示器 | `src/content/overlay.ts` |
| iframe-manager | iframe 创建和通信 | `src/content/iframe-manager.ts` |
| storage | IndexedDB 数据持久化 | `src/content/storage.ts` |

**理由**：
- 单一职责原则，每个模块职责清晰
- 便于独立测试和维护
- 与技术文档 3.1 设计保持一致

### Decision 2: rrweb 集成方式

**选择**: 使用 `rrweb` 包录制，`@rrweb/types` 定义类型

**理由**：
- rrweb 是成熟的录制库，支持全量录制和增量录制
- 已有 `rrdom` 依赖在 package.json 中
- 社区活跃，文档完善

### Decision 3: IndexedDB 存储方案

**选择**: 使用 `idb` 库封装 IndexedDB 操作

**理由**：
- idb 提供 Promise 化的 API，简化异步操作
- 支持事务、索引、游标等高级功能
- 体积小（<5KB gzip）

**存储结构**：
```typescript
interface RecordingStore {
  id: string;           // UUID
  sessionId: string;    // 会话 ID
  events: RREvent[];    // rrweb 事件数组
  startTime: number;    // 开始时间戳
  endTime: number;      // 结束时间戳
  synced: boolean;      // 是否已同步到后端
  createdAt: number;    // 创建时间
}
```

### Decision 4: 消息通信架构

**选择**: 使用 `postMessage` 混合方案

| 通道 | 通信双方 | 用途 |
|------|----------|------|
| `chrome.runtime.sendMessage` | Background ↔ Content Script | 状态同步、命令传递 |
| `postMessage` | Content Script ↔ iframe | UI 交互、录制状态 |
| `BroadcastChannel` | 同一浏览器tab内多脚本 | 备用通信 |

### Decision 5: iframe 嵌入策略

**选择**: 按需创建 iframe，点击模式后动态创建

**理由**：
- 不在页面加载时创建，减少资源消耗
- 用户主动触发，体验更可控
- 位置固定在右下角，可拖拽

### Decision 6: DOM 操作选择器策略

**选择**: CSS 选择器 + 备用选择器

```typescript
interface OperationPayload {
  action: 'click' | 'input' | 'submit' | 'navigate';
  selector: string;
  fallbackSelector?: string;
  value?: string;
}
```

## Module Design

### recorder.ts

```typescript
// 导出接口
interface RecorderModule {
  start(): void;
  stop(): RecordingData;
  pause(): void;
  resume(): void;
  isRecording(): boolean;
  isPaused(): boolean;
}
```

### operator.ts

```typescript
// 导出接口
interface OperatorModule {
  execute(payload: OperationPayload): Promise<OperationResult>;
  click(selector: string): Promise<void>;
  input(selector: string, value: string): Promise<void>;
  submit(selector: string): Promise<void>;
  navigate(url: string): Promise<void>;
}
```

### overlay.ts

```typescript
// 导出接口
interface OverlayModule {
  create(): void;
  destroy(): void;
  show(): void;
  hide(): void;
  updateState(state: 'recording' | 'paused' | 'idle'): void;
  updateDuration(seconds: number): void;
}
```

### iframe-manager.ts

```typescript
// 导出接口
interface IframeManagerModule {
  create(mode: AgentMode, token?: string): HTMLIFrameElement;
  destroy(): void;
  navigate(url: string): void;
  sendMessage(message: AgentMessage): void;
  onMessage(handler: (message: AgentMessage) => void): void;
}
```

### storage.ts

```typescript
// 导出接口
interface StorageModule {
  init(): Promise<void>;
  saveRecording(recording: RecordingData): Promise<string>;
  getRecording(id: string): Promise<Recording | null>;
  listRecordings(limit: number, offset: number): Promise<Recording[]>;
  getUnsyncedRecordings(): Promise<Recording[]>;
  deleteRecording(id: string): Promise<void>;
  markAsSynced(id: string): Promise<void>;
}
```

## Risks / Trade-offs

**[风险] rrweb 内存占用** → **缓解**: 增量录制，定期清理旧事件

**[风险] IndexedDB 存储限制** → **缓解**: 限制单次录制时长，压缩事件数据

**[风险] iframe 跨域通信限制** → **缓解**: 使用 postMessage 配合 origin 验证

**[风险] MV3 Service Worker 生命周期** → **缓解**: 使用 chrome.storage.local 持久化状态

## Migration Plan

1. **Phase 1.1**: 创建 content 模块文件（recorder, operator, overlay, iframe-manager, storage）
2. **Phase 1.2**: 实现 recorder.ts - rrweb 录制
3. **Phase 1.3**: 实现 storage.ts - IndexedDB 存储
4. **Phase 1.4**: 实现 overlay.ts - 录制指示器
5. **Phase 1.5**: 实现 iframe-manager.ts - iframe 嵌入
6. **Phase 1.6**: 实现 operator.ts - DOM 操作
7. **Phase 1.7**: 集成到 index.ts，完善消息通信
8. **Phase 1.8**: 完善 Popup UI

**回滚策略**: 通过 Chrome 扩展管理页面禁用旧版本，加载新版本

## Open Questions

1. **Neo 前端是否支持 iframe 嵌入模式？** 需要确认前端是否有对应的路由和适配
2. **录制数据压缩策略？** rrweb 事件较大，可能需要压缩后再存储
3. **存储容量限制？** 需要定义 IndexedDB 的存储上限和清理策略