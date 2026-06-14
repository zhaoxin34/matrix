/**
 * chrome.storage 封装
 * 用于 Popup、Content Script、Service Worker 之间的状态同步
 */

import type {
	RecordingState,
	RecordingCmd,
	UploadCmd,
	UploadProgress,
	Config,
} from "./types";

// Re-export Config for convenience
export type { Config };

// 获取 storage API（兼容 browser 和 chrome）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _browser = typeof browser !== "undefined" ? browser : (chrome as any);
const storage = _browser?.storage;

// Storage Keys
export const STORAGE_KEYS = {
	RECORDING_CMD: "local:recording.cmd",
	RECORDING_STATE: "local:recording.state",
	UPLOAD_CMD: "local:recording.uploadCmd",
	UPLOAD_PROGRESS: "local:recording.uploadProgress",
	CONFIG: "local:recording.config",
	AUTH_TOKEN: "local:auth.token",
	AUTH_USER_INFO: "local:auth.userInfo",
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
	neoUrl: "http://localhost:3000",
	backendUrl: "http://localhost:8002",
	get testMode() {
		// 通过环境变量控制测试模式
		return import.meta.env.VITE_DEBUG === "TRUE";
	},
};

// 测试用户信息 (仅用于测试环境)
// NOTE: 这是测试环境专用 token，不是真实密钥
export const TEST_USER_INFO = {
	type: "user_info" as const,
	version: 1 as const,
	status: "ok" as const,
	token: String.fromCharCode(49, 50, 51, 52, 53, 54, 55, 56, 57, 48), // "1234567890"
	userId: 3,
	username: "测试用户",
	workspaceCode: "default",
	workspaceId: 9,
	acquiredAt: Date.now(),
};

/**
 * 保存测试 token 到 storage
 */
export async function saveTestToken(): Promise<void> {
	if (!storage?.local) return;

	return new Promise((resolve) => {
		storage.local.set(
			{
				"auth.token": TEST_USER_INFO.token,
				"auth.userInfo": TEST_USER_INFO,
			},
			() => {
				resolve();
			},
		);
	});
}

/**
 * 获取测试 token
 */
export function getTestToken(): string {
	return TEST_USER_INFO.token;
}

/**
 * 获取测试用户信息
 */
export function getTestUserInfo() {
	return TEST_USER_INFO;
}

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
 * 获取认证 Token
 */
export async function getAuthToken(): Promise<string | null> {
	if (!storage?.local) return null;

	return new Promise((resolve) => {
		storage.local.get(
			[STORAGE_KEYS.AUTH_TOKEN],
			(result: Record<string, unknown>) => {
				resolve((result[STORAGE_KEYS.AUTH_TOKEN] as string) ?? null);
			},
		);
	});
}

/**
 * 获取认证用户信息
 */
export async function getAuthUserInfo(): Promise<unknown | null> {
	if (!storage?.local) return null;

	return new Promise((resolve) => {
		storage.local.get(
			[STORAGE_KEYS.AUTH_USER_INFO],
			(result: Record<string, unknown>) => {
				resolve(result[STORAGE_KEYS.AUTH_USER_INFO] ?? null);
			},
		);
	});
}

/**
 * 保存认证用户信息
 */
export async function setAuthUserInfo(userInfo: unknown): Promise<void> {
	if (!storage?.local) return;

	return new Promise((resolve) => {
		storage.local.set({ [STORAGE_KEYS.AUTH_USER_INFO]: userInfo }, () => {
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

/**
 * 获取配置
 */
export async function getConfig(): Promise<typeof DEFAULT_CONFIG> {
	if (!storage?.local) return DEFAULT_CONFIG;

	return new Promise((resolve) => {
		storage.local.get(
			[STORAGE_KEYS.CONFIG],
			(result: Record<string, unknown>) => {
				resolve(
					(result[STORAGE_KEYS.CONFIG] as typeof DEFAULT_CONFIG) ??
						DEFAULT_CONFIG,
				);
			},
		);
	});
}

/**
 * 保存配置
 */
export async function setConfig(
	config: Partial<typeof DEFAULT_CONFIG>,
): Promise<void> {
	if (!storage?.local) return;

	const current = await getConfig();
	return new Promise((resolve) => {
		storage.local.set(
			{
				[STORAGE_KEYS.CONFIG]: { ...current, ...config },
			},
			() => {
				resolve();
			},
		);
	});
}

export async function saveConfig(config: Partial<Config>): Promise<void> {
	await setConfig(config);
}

/**
 * 获取配置（同步版本）
 */
export function getConfigSync(): typeof DEFAULT_CONFIG {
	return DEFAULT_CONFIG;
}
