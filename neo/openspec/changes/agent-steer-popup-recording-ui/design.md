## Context

基于 `design/docs/technical/agent-steer/recording.md` 的技术架构，Popup UI 是录制模块的 UI 层，通过 `chrome.storage` 与 Content Script 通信，实现状态同步。

**现有架构**:
```
RecordingModule
├── RecordingUI (Popup)     # UI 层
├── CS Logic (Content Script) # 录制逻辑
├── SW Logic (Service Worker) # 上传逻辑
└── chrome.storage          # 状态同步通道
```

## Goals / Non-Goals

**Goals:**
- 实现 `RecordingUI` React 组件，显示录制状态和控制按钮
- 支持状态视图：Idle、Recording、Paused、Pending、AuthRequired
- 支持上传流程 UI：输入名称、确认上传、结果显示
- 通过 `chrome.storage.onChanged` 监听状态变化

**Non-Goals:**
- 不实现 CS Logic（录制逻辑）
- 不实现 SW Logic（上传逻辑）
- 不实现 IndexedDB 存储

## Decisions

### Decision 1: 文件结构

**选择**: `src/recording/ui/` 目录存放 UI 组件

**理由**:
- 与技术设计文档保持一致
- 便于后续集成 `RecordingUI` 组件

```
agent-steer/
├── src/
│   ├── recording/
│   │   ├── index.ts          # 主入口
│   │   ├── types.ts          # 类型定义
│   │   ├── storage.ts        # chrome.storage 封装
│   │   └── ui/
│   │       ├── RecordingUI.tsx  # 主组件
│   │       ├── StatusView.tsx   # 状态展示
│   │       ├── ControlPanel.tsx # 控制按钮
│   │       └── UploadPanel.tsx  # 上传流程
│   ├── popup/
│   │   └── main.tsx         # popup 入口
```

### Decision 2: 状态管理

**选择**: 使用 `chrome.storage.onChanged` 监听状态，通过 `useSyncExternalStore` 或自定义 hook 获取状态

**理由**:
- 技术设计文档定义的状态同步方式
- 跨运行环境（Popup ↔ Content Script ↔ Service Worker）

**状态类型**:
```typescript
interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  segmentCount: number;
}
```

### Decision 3: 组件结构

**选择**: 状态机模式，按状态渲染不同 View

```typescript
function RecordingUI() {
  const state = useRecordingState();
  
  if (!state.authChecked) return <AuthRequiredView />;
  if (state.uploadStatus) return <UploadPanel />;
  if (state.isRecording) return <RecordingView />;
  if (state.isPaused) return <PausedView />;
  return <IdleView />;
}
```

### Decision 4: 样式方案

**选择**: Tailwind CSS（WXT 默认支持）

**理由**:
- 快速构建 UI
- 与 WXT 框架兼容

## UI 状态定义

| 状态 | 条件 | 显示内容 |
|------|------|----------|
| `AuthRequired` | 未登录 Neo 或未选 workspace | 提示登录，显示"打开 Neo"按钮 |
| `Idle` | 未开启录制 | "开始录制"按钮 |
| `Recording` | 录制中 | 时长、片段数、"暂停"按钮 |
| `Paused` | 已暂停 | 时长、片段数、"继续"/"上传"/"清除"按钮 |
| `Pending` | 有未上传录像 | 提示有未上传录像，显示"上传"/"丢弃"/"新开一段"按钮 |
| `Uploading` | 上传中 | 输入名称表单 → 上传进度 |
| `Success` | 上传成功 | "查看回放"按钮 |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Content Script 未运行 | Popup 显示提示，引导刷新页面 |
| 状态同步延迟 | 使用 `chrome.storage.onChanged` 实时同步 |

## Open Questions

1. **录制时长刷新频率**: 技术设计未明确，建议 1 秒刷新一次
2. **AuthRequired 检测逻辑**: 是否需要检测 iframe 通信超时？