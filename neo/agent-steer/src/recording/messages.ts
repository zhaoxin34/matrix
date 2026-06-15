/**
 * Recording 消息处理模块
 *
 * 对应设计文档: design/docs/technical/agent-steer/recording.md
 * 统一的消息类型和处理器
 *
 * 使用 WXT 内置 storage API: https://wxt.dev/storage.html
 */

import { storage } from "#imports";
import { STORAGE_KEYS } from "./storage";
import * as db from "./db/indexeddb";

// ==================== 导出共享定义 ====================

export { STORAGE_KEYS, getAuthUserInfo } from "./storage";

// ==================== Storage 操作 ====================

/**
 * 获取录制状态
 */
export async function getRecordingState() {
	try {
		return await storage.getItem(STORAGE_KEYS.RECORDING_STATE);
	} catch {
		return null;
	}
}

/**
 * 设置录制状态
 */
export async function setRecordingState(state: unknown): Promise<void> {
	await storage.setItem(STORAGE_KEYS.RECORDING_STATE, state);
}

/**
 * 获取上传进度
 */
export async function getUploadProgress() {
	try {
		return await storage.getItem(STORAGE_KEYS.UPLOAD_PROGRESS);
	} catch {
		return null;
	}
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

// ==================== 导出消息类型常量 ====================

export const MESSAGE_TYPES = {
	RECORDING_START: "recording.start",
	RECORDING_PAUSE: "recording.pause",
	RECORDING_RESUME: "recording.resume",
	RECORDING_STOP: "recording.stop",
	RECORDING_FETCH: "recording.fetch",
	RECORDING_STATE: "recording.state",
	RECORDING_DATA: "recording.data",
	RECORDING_GET_STATE: "recording.get-state",
	RECORDING_SET_CMD: "recording.set-cmd",
	RECORDING_UPLOAD: "recording.upload",
	RECORDING_CANCEL: "recording.cancel",
	RECORDING_CANCEL_UPLOAD: "cancel-upload",
	RECORDING_GET_UPLOAD_PROGRESS: "recording.get-upload-progress",
	RECORDING_SET_UPLOAD_CMD: "recording.set-upload-cmd",
	RECORDING_OPEN_NEO: "recording.open-neo",
	RECORDING_SAVE_CONFIG: "recording.save-config",
	RECORDING_GET_AUTH_TOKEN: "recording.get-auth-token",
} as const;
