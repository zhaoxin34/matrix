/**
 * Recording 模块类型定义
 *
 * 对应设计文档: design/docs/technical/agent-steer/recording.md
 */

/** 录制状态 */
export interface RecordingState {
	isRecording: boolean;
	isPaused: boolean;
	duration: number; // 录制时长（毫秒）
	segmentCount: number; // 片段数量
	eventCount: number; // 事件总数
	sessionId?: string; // 当前会话 ID
}

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

/** 认证状态 */
export interface AuthState {
	isAuthenticated: boolean;
	isWorkspaceSelected: boolean;
	error?: string;
}

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

/** 配置 */
export interface Config {
	neoUrl: string;
	backendUrl: string;
	testMode?: boolean; // 测试模式
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

/** 认证用户信息 */
export interface UserInfo {
	type: "user_info";
	version: 1;
	status: "ok";
	token: string;
	userId: number;
	username: string;
	workspaceCode: string;
	workspaceId: number;
	acquiredAt: number;
}
