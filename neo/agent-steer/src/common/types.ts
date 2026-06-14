/**
 * 通用类型定义
 */

/** 配置 */
export interface Config {
	neoUrl: string;
	backendUrl: string;
	testMode?: boolean;
}

// ==================== Recording 相关类型 ====================

/**
 * Recording 模块类型定义
 */

/** 录制状态 */
export interface RecordingState {
	isRecording: boolean;
	isPaused: boolean;
	duration: number; // 录制时长（毫秒）
	segmentCount: number; // 片段数量
	eventCount: number; // 事件总数
}

/** 录制命令 */
export interface RecordingCmd {
	action: "start" | "pause" | "resume" | "stop";
}

/** 上传命令 */
export interface UploadCmd {
	name: string; // 录像名称
	workspaceCode: string; // 工作空间代码
}

/** 上传进度 */
export interface UploadProgress {
	taskId: string;
	status: "pending" | "uploading" | "completed" | "failed";
	progress: number; // 0-100
	error?: string;
}

/** Popup 视图状态 */
export type PopupViewState =
	| "AuthRequired"
	| "Idle"
	| "Recording"
	| "Paused"
	| "Pending"
	| "Uploading"
	| "Success"
	| "Error"
	| "Settings"
	| "Loading";

/** 录制片段 */
export interface Segment {
	uid: string;
	startTime: number;
	endTime: number;
	eventCount: number;
}
