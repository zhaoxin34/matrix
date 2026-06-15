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
 * import { initCSRecorder, createCSMessageHandler } from '@/recording';
 * await initCSRecorder();
 * chrome.runtime.onMessage.addListener(createCSMessageHandler());
 *
 * // Service Worker
 * import { initSWRecorder, createSWMessageHandler } from '@/recording';
 * initSWRecorder();
 * chrome.runtime.onMessage.addListener(createSWMessageHandler());
 */

// ==================== Types ====================

export * from "./types";

// ==================== Messages & Constants ====================

export {
	STORAGE_KEYS,
	getAuthUserInfo,
	MESSAGE_TYPES,
} from "./messages";

export {
	getRecordingState,
	setRecordingState,
	getUploadProgress,
	getUnsyncedSegments,
	getActiveSession,
} from "./messages";

export { TEST_USER_INFO, type Config } from "@/common/storage";

// ==================== UI Components ====================

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

// ==================== Service Worker Communicator ====================

export {
	initSWCommunicator,
	startRecording,
	pauseRecording,
	resumeRecording,
	stopRecording,
	getRecordingState as getSWRecordingState,
	startUpload,
	getUploadProgress as getSWUploadProgress,
	cancelUpload,
	clearRecording,
} from "./sw/communicator";

// ==================== Service Worker Uploader ====================

export { cancelUploadAction, clearAllRecordingData } from "./sw/uploader";

// ==================== Content Script Recorder ====================

export {
	initRecorder as initCSRecorder,
	cleanup as cleanupRecorder,
	getCSState,
	addStateListener,
} from "./cs/recorder";
