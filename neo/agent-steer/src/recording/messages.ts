/**
 * Recording 消息处理模块
 *
 * 对应设计文档: design/docs/technical/agent-steer/recording.md
 * 统一的消息类型和处理器
 *
 * 使用 WXT 内置 storage API: https://wxt.dev/storage.html
 */

import { storage } from "#imports";

import type {
	RecordingMessage,
	RecordingMessageResponse,
	RecordingState,
	UploadProgress,
	Config,
	UserInfo,
} from "./types";
import * as db from "./db/indexeddb";

// ==================== Storage Keys ====================

export const STORAGE_KEYS = {
	RECORDING_CMD: "local:recording.cmd",
	RECORDING_STATE: "local:recording.state",
	UPLOAD_CMD: "local:recording.uploadCmd",
	UPLOAD_PROGRESS: "local:recording.uploadProgress",
	CONFIG: "local:recording.config",
	AUTH_TOKEN: "local:auth.token",
	AUTH_USER_INFO: "local:auth.userInfo",
} as const;

// ==================== 默认配置 ====================

export const DEFAULT_CONFIG: Config = {
	neoUrl: "http://localhost:3000",
	backendUrl: "http://localhost:8002",
	testMode: true, // 测试模式默认开启
};

// ==================== 测试用户信息 ====================

export const TEST_USER_INFO: UserInfo = {
	type: "user_info",
	version: 1,
	status: "ok",
	token: String.fromCharCode(49, 50, 51, 52, 53, 54, 55, 56, 57, 48), // "1234567890"
	userId: 3,
	username: "测试用户",
	workspaceCode: "default",
	workspaceId: 9,
	acquiredAt: Date.now(),
};

// ==================== Message Handlers ====================

/**
 * 获取录制状态
 */
export async function getRecordingState(): Promise<RecordingState | null> {
	try {
		return await storage.getItem<RecordingState>(STORAGE_KEYS.RECORDING_STATE);
	} catch {
		return null;
	}
}

/**
 * 设置录制状态
 */
export async function setRecordingState(state: RecordingState): Promise<void> {
	await storage.setItem(STORAGE_KEYS.RECORDING_STATE, state);
}

/**
 * 获取上传进度
 */
export async function getUploadProgress(): Promise<UploadProgress | null> {
	try {
		return await storage.getItem<UploadProgress>(STORAGE_KEYS.UPLOAD_PROGRESS);
	} catch {
		return null;
	}
}

/**
 * 获取配置
 */
export async function getConfig(): Promise<Config> {
	try {
		const config = await storage.getItem<Config>(STORAGE_KEYS.CONFIG);
		return config ?? DEFAULT_CONFIG;
	} catch {
		return DEFAULT_CONFIG;
	}
}

/**
 * 保存配置
 */
export async function saveConfig(config: Config): Promise<void> {
	await storage.setItem(STORAGE_KEYS.CONFIG, config);
}

/**
 * 获取认证 Token
 */
export async function getAuthToken(): Promise<string | null> {
	try {
		return await storage.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
	} catch {
		return null;
	}
}

/**
 * 获取认证用户信息
 */
export async function getAuthUserInfo(): Promise<UserInfo | null> {
	try {
		return await storage.getItem<UserInfo>(STORAGE_KEYS.AUTH_USER_INFO);
	} catch {
		return null;
	}
}

/**
 * 保存认证用户信息
 */
export async function setAuthUserInfo(userInfo: UserInfo): Promise<void> {
	await storage.setItem(STORAGE_KEYS.AUTH_USER_INFO, userInfo);
}

/**
 * 获取未同步的片段
 */
export async function getUnsyncedSegments() {
	await db.initDB();
	return db.getUnsyncedSegments();
}

/**
 * 获取活跃会话
 */
export async function getActiveSession() {
	await db.initDB();
	return db.getActiveSession();
}

// ==================== Content Script 消息处理器 ====================

/**
 * Content Script 消息监听器工厂
 * 用于 content script 注册消息处理
 */
export function createCSMessageHandler() {
	return async (
		message: RecordingMessage,
	): Promise<RecordingMessageResponse> => {
		switch (message.type) {
			case "recording.start":
				// Content Script 不处理 start 命令，由 rrweb-bridge.js 处理
				return { success: true };

			case "recording.pause":
			case "recording.resume":
			case "recording.stop":
				// 转发给 rrweb-bridge.js
				return { success: true };

			case "recording.get-state": {
				const state = await getRecordingState();
				return { success: true, data: state };
			}

			default:
				return {
					success: false,
					error: `Unknown message type: ${message.type}`,
				};
		}
	};
}

// ==================== Service Worker 消息处理器 ====================

/**
 * Service Worker 消息监听器工厂
 * 用于 background service worker 注册消息处理
 */
export function createSWMessageHandler() {
	return async (
		message: RecordingMessage,
	): Promise<RecordingMessageResponse> => {
		// 静默处理消息，不打印日志

		try {
			switch (message.type) {
				case "recording.get-state": {
					const state = await getRecordingState();
					return { success: true, data: state };
				}

				case "recording.set-cmd": {
					const cmd = message.payload;
					await storage.setItem(STORAGE_KEYS.RECORDING_CMD, cmd);
					return { success: true };
				}

				case "recording.get-upload-progress": {
					const progress = await getUploadProgress();
					return { success: true, data: progress };
				}

				case "recording.set-upload-cmd": {
					const cmd = message.payload;
					await storage.setItem(STORAGE_KEYS.UPLOAD_CMD, cmd);
					return { success: true };
				}

				case "recording.save-config": {
					const config = message.payload as Config;
					await saveConfig(config);
					return { success: true };
				}

				case "recording.get-auth-token": {
					const token = await getAuthToken();
					return { success: true, data: token };
				}

				case "recording.open-neo": {
					const { url } = (message.payload as { url?: string }) || {};
					const openUrl = url || DEFAULT_CONFIG.neoUrl;
					browser.tabs.create({ url: openUrl });
					return { success: true };
				}

				default:
					return {
						success: false,
						error: `Unknown message type: ${message.type}`,
					};
			}
		} catch (error) {
			console.error("[SW Handler] Error:", error);
			return { success: false, error: String(error) };
		}
	};
}

// ==================== 导出消息类型常量 ====================

export const MESSAGE_TYPES = {
	// 录制控制
	RECORDING_START: "recording.start",
	RECORDING_PAUSE: "recording.pause",
	RECORDING_RESUME: "recording.resume",
	RECORDING_STOP: "recording.stop",
	RECORDING_FETCH: "recording.fetch",
	RECORDING_STATE: "recording.state",
	RECORDING_DATA: "recording.data",

	// 录制状态
	RECORDING_GET_STATE: "recording.get-state",
	RECORDING_SET_CMD: "recording.set-cmd",

	// 上传
	RECORDING_UPLOAD: "recording.upload",
	RECORDING_CANCEL: "recording.cancel",
	RECORDING_GET_UPLOAD_PROGRESS: "recording.get-upload-progress",
	RECORDING_SET_UPLOAD_CMD: "recording.set-upload-cmd",

	// 其他
	RECORDING_OPEN_NEO: "recording.open-neo",
	RECORDING_SAVE_CONFIG: "recording.save-config",
	RECORDING_GET_AUTH_TOKEN: "recording.get-auth-token",
} as const;
