# Recording UI 组件开发交接文档

## 背景

agent-steer Chrome 扩展项目当前复杂度较高，包含：

- 浏览器扩展基础设施（injection、storage、upload）
- 复杂的 React UI（recording 控制、上传面板）
- 混合的通信逻辑（popup ↔ content script ↔ background script）

**决策**：将 recording UI 部分分离到 front-component 目录，使 agent-steer 专注于核心功能。

## 当前状态

### agent-steer 项目结构

```
agent-steer/
├── entrypoints/
│   ├── content.ts           # Content Script：管理 rrweb 注入
│   ├── background.ts        # Background Script：管理上传
│   └── popup/
│       └── App.tsx          # Popup 主组件
├── src/recording/
│   ├── ui/                  # ❌ 待迁移的 UI 组件
│   │   ├── hooks/
│   │   │   └── useRecordingState.ts
│   │   ├── AuthRequiredView.tsx
│   │   ├── ErrorView.tsx
│   │   ├── IdleView.tsx
│   │   ├── LoadingView.tsx
│   │   ├── PausedView.tsx
│   │   ├── PendingView.tsx
│   │   ├── RecordingUI.tsx
│   │   ├── RecordingView.tsx
│   │   ├── SettingsView.tsx
│   │   ├── SuccessView.tsx
│   │   └── UploadPanel.tsx
│   ├── messages.ts          # 消息类型定义
│   ├── types.ts            # 类型定义
│   ├── db/indexeddb.ts    # IndexedDB 存储
│   ├── auth/              # 认证相关
│   └── sw/uploader.ts    # 上传服务
├── public/
│   ├── recorder.js        # 主世界录制器
│   └── rrweb-record.umd.min.js
└── e2e/
    └── recording.spec.ts  # E2E 测试
```

### Recording 功能架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser Extension                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐         ┌──────────────┐         ┌────────────────┐  │
│  │  Popup   │◄──────►│ Content Script│◄──────►│ Background SW  │  │
│  │  (React) │ storage │   (Bridge)   │postMsg  │  (Upload)     │  │
│  └──────────┘         └──────────────┘         └────────────────┘  │
│                              │                        │             │
│                              │ inject                  │             │
│                              ▼                         ▼             │
│                     ┌─────────────────────────────┐  IndexedDB      │
│                     │         Main World          │      │          │
│                     │  recorder.js + rrweb UMD    │◄─────┘          │
│                     └─────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────────────┘
```

## 待迁移内容

### UI 组件（迁移到 front-component）

| 源文件                                        | 目标位置                                            | 说明             |
| --------------------------------------------- | --------------------------------------------------- | ---------------- |
| `src/recording/ui/*.tsx`                      | `front-component/src/components/recording/ui/`      | 所有 UI 视图组件 |
| `src/recording/ui/hooks/useRecordingState.ts` | `front-component/src/components/recording/hooks/`   | 状态管理 Hook    |
| `src/recording/types.ts`                      | `front-component/src/components/recording/types.ts` | 类型定义         |
| `src/recording/index.ts`                      | `front-component/src/components/recording/index.ts` | 导出和常量       |

### 保留在 agent-steer

| 内容                             | 说明                           |
| -------------------------------- | ------------------------------ |
| `entrypoints/content.ts`         | Content Script，只做 injection |
| `entrypoints/background.ts`      | Background Script，只做 upload |
| `public/recorder.js`             | 主世界录制器                   |
| `public/rrweb-record.umd.min.js` | rrweb UMD                      |
| `src/recording/db/`              | IndexedDB 存储                 |
| `src/recording/sw/uploader.ts`   | 上传服务                       |
| `src/recording/messages.ts`      | 消息协议定义                   |

## 接口协议

### Storage Keys（WXT storage API）

```typescript
const STORAGE_KEYS = {
  RECORDING_CMD: 'local:recording.cmd', // 录制命令
  RECORDING_STATE: 'local:recording.state', // 录制状态
  UPLOAD_CMD: 'local:recording.uploadCmd', // 上传命令
  UPLOAD_PROGRESS: 'local:recording.uploadProgress', // 上传进度
  CONFIG: 'local:recording.config', // 配置
  AUTH_TOKEN: 'local:auth.token', // 认证 Token
  AUTH_USER_INFO: 'local:auth.userInfo', // 用户信息
};
```

### 消息类型

```typescript
type MessageType =
  | 'recording.start'
  | 'recording.pause'
  | 'recording.resume'
  | 'recording.stop'
  | 'recording.get-state'
  | 'recording.set-cmd'
  | 'recording.get-upload-progress'
  | 'recording.set-upload-cmd'
  | 'cancel-upload'
  | 'recording.open-neo'
  | 'recording.save-config'
  | 'recording.get-auth-token';
```

### 核心类型定义

```typescript
interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  segmentCount: number;
  eventCount: number;
  sessionId?: string;
}

interface RecordingCmd {
  action: 'start' | 'pause' | 'resume' | 'stop';
  sessionId?: string;
}

interface UploadProgress {
  taskId: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentSegment?: number;
  totalSegments?: number;
  error?: string;
  recordingUid?: string;
}

type PopupViewState =
  | 'AuthRequired'
  | 'Idle'
  | 'Recording'
  | 'Paused'
  | 'Pending'
  | 'Uploading'
  | 'Success'
  | 'Error'
  | 'Settings'
  | 'Loading';
```

## 相关文档

- 设计文档：`design/docs/technical/agent-steer/recording.md`
- agent-steer AGENTS.md：`agent-steer/AGENTS.md`
- Neo AGENTS.md：`CLAUDE.md`
