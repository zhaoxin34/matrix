/**
 * Recording 模块主入口
 *
 * 对应设计文档: design/docs/technical/agent-steer/recording.md
 *
 * 使用方式:
 *
 * // Popup (React)
 * import { RecordingUI } from '@/recording';
 * <RecordingUI />
 *
 * // Content Script
 * import { initCS, createCSMessageHandler } from '@/recording';
 * initCS();
 * chrome.runtime.onMessage.addListener(createCSMessageHandler());
 *
 * // Service Worker
 * import { createSWMessageHandler } from '@/recording';
 * chrome.runtime.onMessage.addListener(createSWMessageHandler());
 */

// ==================== Types ====================

export * from "./types";

// ==================== Messages & Handlers ====================

export {
	createCSMessageHandler,
	createSWMessageHandler,
	STORAGE_KEYS,
	DEFAULT_CONFIG,
	MESSAGE_TYPES,
} from "./messages";

export {
	getRecordingState,
	setRecordingState,
	getUploadProgress,
	saveConfig,
	getAuthToken,
	getAuthUserInfo,
	getUnsyncedSegments,
	getActiveSession,
} from "./messages";

export { TEST_USER_INFO } from "@/common/storage";

// ==================== UI Components ====================

// 这些组件已移至 @/ui 目录
// import { SettingsView } from "@/ui/SettingsView";
// import { AuthRequiredView } from "@/ui/AuthRequiredView";

export { RecordingUI } from "./ui/RecordingUI";
export type { RecordingUIProps } from "./ui/RecordingUI";
export { IdleView } from "./ui/IdleView";
export { RecordingView } from "./ui/RecordingView";
export { PausedView } from "./ui/PausedView";
export { PendingView } from "./ui/PendingView";
export { UploadPanel } from "./ui/UploadPanel";
export { SuccessView } from "./ui/SuccessView";
export { ErrorView } from "./ui/ErrorView";
export { LoadingView } from "./ui/LoadingView";

// ==================== Hooks ====================

export { useRecordingState } from "./ui/hooks/useRecordingState";

// ==================== Database Operations ====================

export * as db from "./db/indexeddb";

// ==================== Service Worker Uploader ====================

export {
	initUploader,
	getProgress,
	cleanup as cleanupUploader,
} from "./sw/uploader";

// ==================== Content Script Recorder ====================

export { initRecorder, cleanup as cleanupRecorder } from "./cs/recorder";
