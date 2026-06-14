/**
 * Recording 消息处理模块
 *
 * 对应设计文档: design/docs/technical/agent-steer/recording.md
 * 统一的消息类型和处理器
 *
 * 使用 WXT 内置 storage API: https://wxt.dev/storage.html
 */

import { storage } from "#imports";
import type { RecordingMessage, RecordingMessageResponse } from "./types";
import {
	STORAGE_KEYS,
	DEFAULT_CONFIG,
	saveConfig,
	getAuthToken,
} from "@/common/storage";
import * as db from "./db/indexeddb";

// ==================== 导出共享定义 ====================

export {
	STORAGE_KEYS,
	DEFAULT_CONFIG,
	saveConfig,
	getAuthToken,
	getAuthUserInfo,
} from "@/common/storage";

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

// ==================== Content Script 消息处理器 ====================

/**
 * Content Script 消息监听器工厂
 */
export function createCSMessageHandler() {
	return async (
		message: RecordingMessage,
	): Promise<RecordingMessageResponse> => {
		switch (message.type) {
			case "recording.start":
			case "recording.pause":
			case "recording.resume":
			case "recording.stop":
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
 */
export function createSWMessageHandler() {
	return async (
		message: RecordingMessage,
	): Promise<RecordingMessageResponse> => {
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

				case "cancel-upload": {
					await storage.setItem(STORAGE_KEYS.UPLOAD_CMD, { action: "cancel" });
					return { success: true };
				}

				case "recording.save-config": {
					const config = message.payload as Parameters<typeof saveConfig>[0];
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
			return { success: false, error: String(error) };
		}
	};
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
