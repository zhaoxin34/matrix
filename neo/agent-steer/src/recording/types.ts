/**
 * Recording 模块类型定义
 *
 * 对应设计文档: design/docs/technical/agent-steer/recording.md
 */

/**
 * 录制状态枚举
 * - idle: 空闲状态，未开始录制
 * - recording: 录制中
 * - paused: 已暂停（可继续或停止）
 * - pending: 已停止（数据就绪，可上传或清除）
 * - uploading: 上传中
 * - success: 上传成功
 * - error: 错误状态
 */
export type RecordingStatus =
	| "idle"
	| "recording"
	| "paused"
	| "pending"
	| "uploading"
	| "success"
	| "error";

/**
 * 录制状态
 */
export interface RecordingState {
	status: RecordingStatus;
	duration: number; // 录制时长（毫秒）
	segmentCount: number; // 片段数量
	eventCount: number; // 事件总数
	sessionId?: string; // 当前会话 ID
	startTime?: number; // 开始录制的时间戳（毫秒）
	error?: string; // 错误信息（error 状态时使用）
	uploadProgress?: number; // 上传进度（uploading 状态时使用）
}

/**
 * 默认的空闲状态
 */
export const DEFAULT_IDLE_STATE: RecordingState = {
	status: "idle",
	duration: 0,
	segmentCount: 0,
	eventCount: 0,
};

/** 录制命令 */
export interface RecordingCmd {
	action: "start" | "pause" | "resume" | "stop";
	sessionId?: string; // 用于 start 命令
}

/** 上传命令 */
export interface UploadCmd {
	name: string; // 录像名称
	workspaceCode: string; // 工作空间代码
	sessionId?: string; // 可选，指定要上传的 session
}

/** 上传进度 */
export interface UploadProgress {
	taskId: string;
	status: "pending" | "uploading" | "completed" | "failed" | "cancelled";
	progress: number; // 0-100
	currentSegment?: number;
	totalSegments?: number;
	error?: string;
	recordingUid?: string; // 上传成功后返回的 recording UID
}

/** Popup 视图状态 (全局) */
export type PopupViewState =
	| "AuthRequired"
	| "Idle"
	| "Recording"
	| "Paused"
	| "Pending"
	| "UploadInput"
	| "Uploading"
	| "Success"
	| "Error"
	| "Settings"
	| "Loading";

/** RecordingUI 视图状态 (录制相关，不包含 AuthRequired 和 Settings) */
export type RecordingViewState =
	| "Idle"
	| "Recording"
	| "Paused"
	| "Pending"
	| "Uploading"
	| "Success"
	| "Error"
	| "Loading";

/** 录制片段 (IndexedDB 存储) */
export interface Segment {
	uid: string; // UUID
	sessionId: string; // 录制会话 ID
	sequence: number; // 片段序号（从 1 开始）
	startTime: number; // Unix ms
	endTime: number; // Unix ms
	eventCount: number; // 事件数量
	events: string; // JSON 序列化的 rrweb 事件
	pageUrls: string[]; // 访问过的 URL
	createdAt: number; // 存储时间
	synced: boolean; // 是否已上传
}

/** 录制会话 (IndexedDB 存储) */
export interface RecordingSession {
	uid: string; // UUID
	startTime: number; // Unix ms
	endTime?: number; // Unix ms，undefined 表示仍在进行
	active: boolean; // 是否活跃
	createdAt: number; // 创建时间
}

// ==================== 消息协议 ====================

/** 消息类型 (设计文档定义) */
export type MessageType =
	| "recording.start"
	| "recording.pause"
	| "recording.resume"
	| "recording.stop"
	| "recording.fetch"
	| "recording.state"
	| "recording.data"
	| "recording.upload"
	| "recording.cancel"
	| "cancel-upload"
	| "recording.get-state"
	| "recording.set-cmd"
	| "recording.get-upload-progress"
	| "recording.set-upload-cmd"
	| "recording.open-neo"
	| "recording.save-config"
	| "recording.get-auth-token";

/** 消息处理器 */
export type MessageHandler = (
	message: RecordingMessage,
) => Promise<RecordingMessageResponse>;

/** 录制消息 */
export interface RecordingMessage {
	type: MessageType;
	payload?: unknown;
}

/** 录制消息响应 */
export interface RecordingMessageResponse {
	success: boolean;
	data?: unknown;
	error?: string;
}

// ==================== CS 通信协议 ====================

/** CS 推送到 Popup 的消息类型 */
export type CSToPopupMessageType = "state-update" | "recording-response";

/** CS 状态更新消息 */
export interface CSStateUpdateMessage {
	/** 消息方向标识 */
	direction: "cs→popup";
	/** 消息类型 */
	type: "state-update";
	/** 录制状态 */
	state: {
		status: RecordingStatus;
		sessionId: string | null;
		segmentUid: string | null;
		eventCount: number;
		segmentCount: number;
		duration: number;
		error?: string;
		uploadProgress?: number;
	};
}

/** CS 命令响应消息 */
export interface CSCommandResponseMessage {
	/** 消息方向标识 */
	direction: "cs→popup";
	/** 消息类型 */
	type: "recording-response";
	/** 关联的请求 ID */
	requestId: string;
	/** 命令类型 */
	command: "start" | "pause" | "resume" | "stop" | "reset";
	/** 是否成功 */
	success: boolean;
	/** 错误信息 */
	error?: string;
	/** sessionId（start 命令成功时返回）*/
	sessionId?: string;
}

/** CS 推送到 Popup 的消息联合类型 */
export type CSToPopupMessage = CSStateUpdateMessage | CSCommandResponseMessage;

/** Popup 发送到 CS 的消息 */
export interface PopupToCSMessage {
	/** 消息方向标识 */
	direction: "popup→sw→cs";
	/** 消息类型 */
	type: "recording-cmd";
	/** 请求 ID，用于关联响应 */
	requestId: string;
	/** 命令 */
	command: "start" | "pause" | "resume" | "stop" | "reset";
}

/** SW 路由到 CS 的消息（添加 tabId）*/
export interface SWToCSMessage extends PopupToCSMessage {
	tabId: number;
}
