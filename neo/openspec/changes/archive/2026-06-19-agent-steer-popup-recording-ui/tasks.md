## 1. Setup

- [x] 1.1 创建 `src/recording/` 目录结构
- [x] 1.2 创建 `src/recording/ui/` 子目录
- [x] 1.3 创建 `src/recording/types.ts` 类型定义文件

## 2. Type Definitions

- [x] 2.1 定义 `RecordingState` 接口（isRecording, isPaused, duration, segmentCount）
- [x] 2.2 定义 `UploadProgress` 接口（taskId, status, progress, error）
- [x] 2.3 定义 `RecordingCmd` 接口（action: start|pause|resume|stop）
- [x] 2.4 定义 `UploadCmd` 接口（name, workspaceCode）
- [x] 2.5 定义 `PopupViewState` 类型（AuthRequired|Idle|Recording|Paused|Pending|Uploading|Success|Error）

## 3. Storage Module

- [x] 3.1 创建 `src/recording/storage.ts`
- [x] 3.2 定义 STORAGE_KEYS 常量
- [x] 3.3 实现 `getRecordingState()` 函数
- [x] 3.4 实现 `setRecordingCmd()` 函数
- [x] 3.5 实现 `getUploadProgress()` 函数
- [x] 3.6 实现 `subscribeToChanges()` 监听状态变化

## 4. UI Components

- [x] 4.1 创建 `src/recording/ui/RecordingUI.tsx` 主组件
- [x] 4.2 创建 `src/recording/ui/StatusView.tsx` 状态展示组件
- [x] 4.3 创建 `src/recording/ui/ControlPanel.tsx` 控制按钮组件
- [x] 4.4 创建 `src/recording/ui/UploadPanel.tsx` 上传流程组件
- [x] 4.5 创建 `src/recording/ui/AuthRequiredView.tsx` 认证提示组件

## 5. State Management

- [x] 5.1 创建 `src/recording/ui/hooks/useRecordingState.ts` 自定义 hook
- [x] 5.2 实现状态机逻辑（基于 RecordingState 映射到 PopupViewState）
- [x] 5.3 实现 auth 状态检测逻辑
- [x] 5.4 实现 pending 状态检测（检查 IndexedDB）

## 6. Popup Integration

- [x] 6.1 更新 `entrypoints/popup/main.tsx` 引入 RecordingUI
- [x] 6.2 更新 `entrypoints/popup/App.tsx` 使用 RecordingUI
- [x] 6.3 配置 Tailwind CSS 样式
- [x] 6.4 更新 `entrypoints/popup/style.css` 基础样式

## 7. UI States Implementation

- [x] 7.1 实现 AuthRequiredView（未登录/未选工作区/超时提示）
- [x] 7.2 实现 IdleView（显示"开始录制"按钮）
- [x] 7.3 实现 RecordingView（显示时长、片段数、"暂停"按钮）
- [x] 7.4 实现 PausedView（显示时长、片段数、"继续"/"上传"/"清除"按钮）
- [x] 7.5 实现 PendingView（显示未上传提示和操作按钮）
- [x] 7.6 实现 UploadForm（输入名称表单）
- [x] 7.7 实现 UploadProgress（上传进度条）
- [x] 7.8 实现 SuccessView（"上传成功"和"查看回放"按钮）

## 8. Actions Implementation

- [x] 8.1 实现"开始录制"按钮点击逻辑
- [x] 8.2 实现"暂停"按钮点击逻辑
- [x] 8.3 实现"继续录制"按钮点击逻辑
- [x] 8.4 实现"上传"按钮点击逻辑（切换到 UploadForm）
- [x] 8.5 实现"清除"按钮点击逻辑（含确认对话框）
- [x] 8.6 实现"取消"按钮点击逻辑
- [x] 8.7 实现"确认上传"按钮点击逻辑
- [x] 8.8 实现"查看回放"按钮点击逻辑（跳转到 Neo Frontend）
