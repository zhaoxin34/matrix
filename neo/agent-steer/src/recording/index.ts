/**
 * Recording 模块主入口
 * 导出所有类型、工具函数和 UI 组件
 */

// Types
export * from "./types";

// Storage
export * from "./storage";
export { DEFAULT_CONFIG } from "./storage";
export type { Config } from "./storage";

// UI Components
export { RecordingUI } from "./ui/RecordingUI";
export type { RecordingUIProps } from "./ui/RecordingUI";
export { AuthRequiredView } from "./ui/AuthRequiredView";
export { IdleView } from "./ui/IdleView";
export { RecordingView } from "./ui/RecordingView";
export { PausedView } from "./ui/PausedView";
export { PendingView } from "./ui/PendingView";
export { UploadPanel } from "./ui/UploadPanel";
export { SuccessView } from "./ui/SuccessView";
export { ErrorView } from "./ui/ErrorView";
export { LoadingView } from "./ui/LoadingView";
export { SettingsView } from "./ui/SettingsView";

// Hooks
export { useRecordingState } from "./ui/hooks/useRecordingState";
