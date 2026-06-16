/**
 * CS 状态管理
 */

import type { RecordingState, RecordingStatus } from "../types";
import type { StateListener } from "./types";
import { storage } from "#imports";
import { STORAGE_KEYS } from "../storage";
import { logger } from "@/common/logger";
import { DEFAULT_IDLE_STATE } from "../types";

/** 当前录制状态 */
let currentState: RecordingState = { ...DEFAULT_IDLE_STATE };

/** 状态监听器列表 */
const stateListeners = new Set<StateListener>();

/**
 * 获取当前状态
 */
export function getCurrentState(): RecordingState {
	return currentState;
}

/**
 * 更新状态并通知所有监听器
 */
export function notifyStateChange(state: Partial<RecordingState>): void {
	currentState = { ...currentState, ...state };
	logger.cs.debug("状态更新:", currentState);

	for (const listener of stateListeners) {
		try {
			listener(currentState);
		} catch (e) {
			logger.cs.error("状态监听器执行失败:", e);
		}
	}

	// 推送状态到 Popup
	pushStateToPopup();

	// 同步状态到 storage（供 SW 读取）
	syncStateToStorage();
}

/**
 * 同步状态到 storage
 */
async function syncStateToStorage(): Promise<void> {
	try {
		await storage.setItem(STORAGE_KEYS.RECORDING_STATE, currentState);
		logger.cs.debug("状态已同步到 storage");
	} catch (e) {
		logger.cs.error("状态同步到 storage 失败:", e);
	}
}

/**
 * 推送状态到 Popup
 */
function pushStateToPopup(): void {
	chrome.runtime
		.sendMessage({
			direction: "cs→popup",
			type: "state-update",
			state: {
				status: currentState.status,
				sessionId: currentState.sessionId ?? null,
				segmentUid: null,
				eventCount: currentState.eventCount,
				segmentCount: currentState.segmentCount,
				duration: currentState.duration,
				error: currentState.error,
				uploadProgress: currentState.uploadProgress,
			},
		})
		.catch((e) => {
			logger.cs.debug("推送状态到 Popup 失败:", e);
		});
}

/**
 * 推送命令响应到 Popup
 */
export function pushCommandResponseToPopup(
	requestId: string,
	command: "start" | "pause" | "resume" | "stop" | "reset",
	success: boolean,
	sessionId?: string,
	error?: string,
): void {
	chrome.runtime
		.sendMessage({
			direction: "cs→popup",
			type: "recording-response",
			requestId,
			command,
			success,
			sessionId,
			error,
		})
		.catch((e) => {
			logger.cs.debug("推送命令响应到 Popup 失败:", e);
		});
}

/**
 * 推送上传进度到 Popup / SW（spike 用，正式实现会复用此通道）
 */
export function pushUploadProgress(progress: {
	taskId: string;
	status: "pending" | "uploading" | "completed" | "failed" | "cancelled";
	progress: number;
	currentSegment?: number;
	totalSegments?: number;
	error?: string;
	recordingUid?: string;
}): void {
	chrome.runtime
		.sendMessage({
			direction: "cs→popup",
			type: "upload-progress",
			payload: progress,
		})
		.catch((e) => {
			logger.cs.debug("推送 upload-progress 失败:", e);
		});
}

/**
 * 添加状态监听器
 */
export function addStateListener(listener: StateListener): () => void {
	stateListeners.add(listener);
	return () => stateListeners.delete(listener);
}

/**
 * 定时器回调：更新时长
 */
export function tickDuration(): void {
	if (currentState.status === "recording" && currentState.startTime) {
		const duration = Date.now() - currentState.startTime;
		notifyStateChange({ duration });
	}
}

/**
 * 重置状态到默认值
 */
export function resetState(): void {
	logger.cs.info("resetState: 重置状态");
	currentState = { ...DEFAULT_IDLE_STATE };
	pushStateToPopup();
	syncStateToStorage();
}

/**
 * 设置状态（带验证）
 */
export function setStatus(status: RecordingStatus): void {
	currentState = { ...currentState, status };
	pushStateToPopup();
	syncStateToStorage();
}
