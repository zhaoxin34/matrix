/**
 * chrome.storage 封装
 * 用于 Popup、Content Script、Service Worker 之间的状态同步
 */

import type {
	RecordingState,
	RecordingCmd,
	UploadCmd,
	UploadProgress,
} from "./types";

// Re-export Config for convenience
export type { Config } from "./storage.local/auth";

// Re-export sysconfig functions
// eslint-disable-next-line @typescript-eslint/consistent-type-imports

export {
	DEFAULT_CONFIG,
	getConfig,
	setConfig,
	saveConfig,
} from "./storage.local/sysconfig";

// Re-export auth functions
export {
	AUTH_STORAGE_KEYS,
	TEST_USER_INFO,
	saveTestToken,
	getTestToken,
	getTestUserInfo,
	getAuthToken,
	getAuthUserInfo,
	setAuthUserInfo,
} from "./storage.local/auth";

// 获取 storage API（兼容 browser 和 chrome）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _browser = typeof browser !== "undefined" ? browser : (chrome as any);
const storage = _browser?.storage;

// Storage Keys - 录制 & 上传
export const STORAGE_KEYS = {
	RECORDING_CMD: "local:recording.cmd",
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

/**
 * 设置录制命令
 */
export async function setRecordingCmd(cmd: RecordingCmd): Promise<void> {
	if (!storage?.local) return;

	return new Promise((resolve) => {
		storage.local.set({ [STORAGE_KEYS.RECORDING_CMD]: cmd }, () => {
			resolve();
		});
	});
}

/**
 * 获取上传进度
 */
export async function getUploadProgress(): Promise<UploadProgress | null> {
	if (!storage?.local) return null;

	return new Promise((resolve) => {
		storage.local.get(
			[STORAGE_KEYS.UPLOAD_PROGRESS],
			(result: Record<string, unknown>) => {
				resolve(
					(result[STORAGE_KEYS.UPLOAD_PROGRESS] as UploadProgress) ?? null,
				);
			},
		);
	});
}

/**
 * 设置上传命令
 */
export async function setUploadCmd(cmd: UploadCmd): Promise<void> {
	if (!storage?.local) return;

	return new Promise((resolve) => {
		storage.local.set({ [STORAGE_KEYS.UPLOAD_CMD]: cmd }, () => {
			resolve();
		});
	});
}

/**
 * 清除上传进度
 */
export async function clearUploadProgress(): Promise<void> {
	if (!storage?.local) return;

	return new Promise((resolve) => {
		storage.local.remove([STORAGE_KEYS.UPLOAD_PROGRESS], () => {
			resolve();
		});
	});
}

/**
 * 清除上传命令
 */
export async function clearUploadCmd(): Promise<void> {
	if (!storage?.local) return;

	return new Promise((resolve) => {
		storage.local.remove([STORAGE_KEYS.UPLOAD_CMD], () => {
			resolve();
		});
	});
}

/**
 * 清除录制命令
 */
export async function clearRecordingCmd(): Promise<void> {
	if (!storage?.local) return;

	return new Promise((resolve) => {
		storage.local.remove([STORAGE_KEYS.RECORDING_CMD], () => {
			resolve();
		});
	});
}

/**
 * 监听状态变化
 */
export function subscribeToChanges(
	callback: (
		changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
	) => void,
): () => void {
	if (!storage?.onChanged) {
		return () => {};
	}

	const listener = (
		changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
		areaName: string,
	) => {
		if (areaName === "local") {
			callback(changes);
		}
	};

	storage.onChanged.addListener(listener);

	// 返回取消订阅函数
	return () => {
		storage.onChanged.removeListener(listener);
	};
}

/**
 * 监听录制状态变化
 */
export function subscribeToRecordingState(
	callback: (state: RecordingState) => void,
): () => void {
	return subscribeToChanges((changes) => {
		const state = changes[STORAGE_KEYS.RECORDING_STATE];
		if (state?.newValue) {
			callback(state.newValue as RecordingState);
		}
	});
}

/**
 * 监听上传进度变化
 */
export function subscribeToUploadProgress(
	callback: (progress: UploadProgress | null) => void,
): () => void {
	return subscribeToChanges((changes) => {
		const progress = changes[STORAGE_KEYS.UPLOAD_PROGRESS];
		callback((progress?.newValue as UploadProgress) ?? null);
	});
}
