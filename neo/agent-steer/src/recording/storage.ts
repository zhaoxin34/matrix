/**
 * chrome.storage 封装
 * 用于 Popup、Content Script、Service Worker 之间的状态同步
 */

import type { RecordingState } from "./types";

// Re-export auth functions
import { getAuthToken, getAuthUserInfo } from "../common/storage";

// Re-export for consumers
export { getAuthToken, getAuthUserInfo };

// 获取 storage API（兼容 browser 和 chrome）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _browser = typeof browser !== "undefined" ? browser : (chrome as any);
const storage = _browser?.storage;

// Storage Keys
export const STORAGE_KEYS = {
	RECORDING_STATE: "local:recording.state",
	UPLOAD_CMD: "local:recording.uploadCmd",
	UPLOAD_PROGRESS: "local:recording.uploadProgress",
} as const;

/**
 * 获取当前录制状态
 */
export async function getRecordingState(): Promise<RecordingState> {
	if (!storage?.local) {
		return {
			isRecording: false,
			isPaused: false,
			duration: 0,
			segmentCount: 0,
			eventCount: 0,
		};
	}

	return new Promise((resolve) => {
		storage.local.get(
			[STORAGE_KEYS.RECORDING_STATE],
			(result: Record<string, unknown>) => {
				const state = result[STORAGE_KEYS.RECORDING_STATE] as
					| RecordingState
					| undefined;
				resolve(
					state ?? {
						isRecording: false,
						isPaused: false,
						duration: 0,
						segmentCount: 0,
						eventCount: 0,
					},
				);
			},
		);
	});
}
