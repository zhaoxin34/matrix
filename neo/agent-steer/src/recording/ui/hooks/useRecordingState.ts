/**
 * useRecordingState - 管理录制状态的 React Hook
 */

import { useState, useEffect, useCallback } from "react";
import type {
	RecordingState,
	RecordingCmd,
	UploadProgress,
	PopupViewState,
} from "../../types";
import {
	MESSAGE_TYPES,
	DEFAULT_CONFIG,
	TEST_USER_INFO,
	type Config,
} from "../../index";
import { fetchAuthState, type UserInfo } from "../../auth/iframe-bridge";

// 默认状态
const DEFAULT_RECORDING_STATE: RecordingState = {
	isRecording: false,
	isPaused: false,
	duration: 0,
	segmentCount: 0,
	eventCount: 0,
};

export interface UseRecordingStateReturn {
	// 状态
	recordingState: RecordingState;
	uploadProgress: UploadProgress | null;
	authState: {
		isAuthenticated: boolean;
		isWorkspaceSelected: boolean;
		userInfo: UserInfo | null;
	};
	viewState: PopupViewState;
	config: Config;
	isLoading: boolean;

	// 上传状态
	isUploading: boolean;
	uploadError: string | null;

	// 操作
	startRecording: () => Promise<void>;
	pauseRecording: () => Promise<void>;
	resumeRecording: () => Promise<void>;
	stopRecording: () => Promise<void>;
	startUpload: (name: string) => Promise<void>;
	cancelUpload: () => Promise<void>;
	openNeo: () => void;
	retryAuth: () => void;
	openSettings: () => void;
	closeSettings: () => void;
	saveSettings: (config: Config) => Promise<void>;
}

/**
 * 发送消息到 Background Script
 */
async function sendMessage<T>(
	type: string,
	payload?: unknown,
): Promise<T | null> {
	if (typeof browser === "undefined" && typeof chrome === "undefined") {
		console.error("[useRecordingState] No browser API available!");
		return null;
	}

	const api = typeof browser !== "undefined" ? browser : chrome;

	return new Promise((resolve) => {
		try {
			api.runtime.sendMessage({ type, payload }, (response) => {
				if (response?.success) {
					resolve(response.data ?? null);
				} else {
					resolve(null);
				}
			});
		} catch (error) {
			console.error("[useRecordingState] Send error:", error);
			resolve(null);
		}
	});
}

/**
 * 获取录制状态
 */
async function getRecordingState(): Promise<RecordingState> {
	const state = await sendMessage<RecordingState>(
		MESSAGE_TYPES.RECORDING_GET_STATE,
	);
	return state ?? DEFAULT_RECORDING_STATE;
}

/**
 * 设置录制命令
 */
async function setRecordingCmd(cmd: RecordingCmd): Promise<void> {
	await sendMessage(MESSAGE_TYPES.RECORDING_SET_CMD, cmd);
}

/**
 * 获取上传进度
 */
async function getUploadProgress(): Promise<UploadProgress | null> {
	return await sendMessage<UploadProgress>(
		MESSAGE_TYPES.RECORDING_GET_UPLOAD_PROGRESS,
	);
}

/**
 * 设置上传命令
 */
async function setUploadCmd(
	name: string,
	workspaceCode: string,
): Promise<void> {
	await sendMessage(MESSAGE_TYPES.RECORDING_SET_UPLOAD_CMD, {
		name,
		workspaceCode,
	});
}

/**
 * 打开 Neo
 */
async function openNeo(url: string): Promise<void> {
	await sendMessage(MESSAGE_TYPES.RECORDING_OPEN_NEO, { url });
}

export function useRecordingState(): UseRecordingStateReturn {
	const [recordingState, setRecordingState] = useState<RecordingState>(
		DEFAULT_RECORDING_STATE,
	);
	const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
		null,
	);
	const [authState, setAuthState] = useState({
		isAuthenticated: false,
		isWorkspaceSelected: false,
		userInfo: null as UserInfo | null,
	});
	const [config, setConfigState] = useState<Config>(DEFAULT_CONFIG);
	const [showSettings, setShowSettings] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// 初始化：获取配置和认证状态
	useEffect(() => {
		const init = async () => {
			setIsLoading(true);

			// 获取录制状态
			const state = await getRecordingState();
			console.log("[useRecordingState] Initial recording state:", state);
			setRecordingState(state);

			// 获取上传进度
			const progress = await getUploadProgress();
			setUploadProgress(progress);

			// 测试模式下使用测试用户
			if (DEFAULT_CONFIG.testMode) {
				console.log("[useRecordingState] Test mode enabled");
				setAuthState({
					isAuthenticated: true,
					isWorkspaceSelected: true,
					userInfo: {
						...TEST_USER_INFO,
						acquiredAt: Date.now(),
					},
				});
			} else {
				// 通过 iframe 获取认证状态
				const auth = await fetchAuthState();
				setAuthState({
					isAuthenticated: auth.isAuthenticated,
					isWorkspaceSelected: auth.isWorkspaceSelected,
					userInfo: auth.userInfo,
				});
			}

			setIsLoading(false);
		};

		init();
	}, []);

	// 轮询录制状态和上传进度（5秒间隔）
	useEffect(() => {
		const pollInterval = setInterval(async () => {
			const state = await getRecordingState();
			setRecordingState(state);

			const progress = await getUploadProgress();
			setUploadProgress(progress);
		}, 5000);

		return () => clearInterval(pollInterval);
	}, []);

	// 计算视图状态
	const viewState: PopupViewState = (() => {
		// 加载中
		if (isLoading) {
			return "Loading";
		}

		// 如果在设置页面
		if (showSettings) {
			return "Settings";
		}

		// 如果正在上传中
		if (uploadProgress && uploadProgress.status === "uploading") {
			return "Uploading";
		}

		// 如果上传成功
		if (uploadProgress && uploadProgress.status === "completed") {
			return "Success";
		}

		// 如果上传失败
		if (uploadProgress && uploadProgress.status === "failed") {
			return "Error";
		}

		// 如果未登录
		if (!authState.isAuthenticated) {
			return "AuthRequired";
		}

		// 如果未选工作区
		if (!authState.isWorkspaceSelected) {
			return "AuthRequired";
		}

		// 如果有未上传的录像（Pending 状态）
		if (recordingState.segmentCount > 0 && !recordingState.isRecording) {
			return "Pending";
		}

		// 如果正在录制
		if (recordingState.isRecording && !recordingState.isPaused) {
			return "Recording";
		}

		// 如果已暂停
		if (recordingState.isPaused) {
			return "Paused";
		}

		// 默认空闲状态
		return "Idle";
	})();

	// 操作函数
	const startRecording = useCallback(async () => {
		console.log("[useRecordingState] startRecording clicked");
		await setRecordingCmd({ action: "start" });
	}, []);

	const pauseRecording = useCallback(async () => {
		await setRecordingCmd({ action: "pause" });
	}, []);

	const resumeRecording = useCallback(async () => {
		await setRecordingCmd({ action: "resume" });
	}, []);

	const stopRecording = useCallback(async () => {
		await setRecordingCmd({ action: "stop" });
	}, []);

	const startUpload = useCallback(
		async (name: string) => {
			await setUploadCmd(name, authState.userInfo?.workspaceCode ?? "default");
		},
		[authState.userInfo],
	);

	const cancelUpload = useCallback(async () => {
		await sendMessage("cancel-upload", {});
	}, []);

	const openNeoHandler = useCallback(() => {
		openNeo(config.neoUrl);
	}, [config.neoUrl]);

	const retryAuth = useCallback(async () => {
		setIsLoading(true);
		const auth = await fetchAuthState();
		setAuthState({
			isAuthenticated: auth.isAuthenticated,
			isWorkspaceSelected: auth.isWorkspaceSelected,
			userInfo: auth.userInfo,
		});
		setIsLoading(false);
	}, []);

	const openSettings = useCallback(() => {
		setShowSettings(true);
	}, []);

	const closeSettings = useCallback(() => {
		setShowSettings(false);
	}, []);

	const saveSettings = useCallback(async (newConfig: Config) => {
		// 保存配置到 storage
		await sendMessage(MESSAGE_TYPES.RECORDING_SAVE_CONFIG, newConfig);
		setConfigState(newConfig);
		setShowSettings(false);
	}, []);

	return {
		recordingState,
		uploadProgress,
		authState,
		viewState,
		config,
		isLoading,
		isUploading: uploadProgress?.status === "uploading",
		uploadError:
			uploadProgress?.status === "failed"
				? (uploadProgress.error ?? "上传失败")
				: null,
		startRecording,
		pauseRecording,
		resumeRecording,
		stopRecording,
		startUpload,
		cancelUpload,
		openNeo: openNeoHandler,
		retryAuth,
		openSettings,
		closeSettings,
		saveSettings,
	};
}
