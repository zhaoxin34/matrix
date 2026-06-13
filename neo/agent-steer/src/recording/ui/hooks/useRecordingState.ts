/**
 * useRecordingState - 管理录制状态的 React Hook
 */

import { useState, useEffect, useCallback } from "react";
import type {
	RecordingState,
	UploadProgress,
	AuthState,
	PopupViewState,
} from "../../types";
import { DEFAULT_CONFIG, type Config } from "../../storage";
import {
	getRecordingState,
	subscribeToRecordingState,
	subscribeToUploadProgress,
	setRecordingCmd,
	setUploadCmd,
	getConfig,
	setConfig,
} from "../../storage";

export interface UseRecordingStateReturn {
	// 状态
	recordingState: RecordingState;
	uploadProgress: UploadProgress | null;
	authState: AuthState;
	viewState: PopupViewState;
	config: Config;

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

// 默认状态
const DEFAULT_RECORDING_STATE: RecordingState = {
	isRecording: false,
	isPaused: false,
	duration: 0,
	segmentCount: 0,
	eventCount: 0,
};

const DEFAULT_AUTH_STATE: AuthState = {
	isAuthenticated: false,
	isWorkspaceSelected: false,
};

export function useRecordingState(): UseRecordingStateReturn {
	const [recordingState, setRecordingState] = useState<RecordingState>(
		DEFAULT_RECORDING_STATE,
	);
	const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
		null,
	);
	const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);
	const [config, setConfigState] = useState<Config>(DEFAULT_CONFIG);
	const [showSettings, setShowSettings] = useState(false);

	// 初始化：获取初始状态
	useEffect(() => {
		const init = async () => {
			// 获取配置
			const cfg = await getConfig();
			setConfigState(cfg);

			// 获取录制状态
			const state = await getRecordingState();
			setRecordingState(state);

			// TODO: 检查 Auth 状态 (需要通过 iframe 通信)
			// 暂时设为默认未认证
			setAuthState({
				isAuthenticated: false,
				isWorkspaceSelected: false,
			});
		};

		init();
	}, []);

	// 监听录制状态变化
	useEffect(() => {
		const unsubscribe = subscribeToRecordingState((state: RecordingState) => {
			setRecordingState(state);
		});

		return unsubscribe;
	}, []);

	// 监听上传进度变化
	useEffect(() => {
		const unsubscribe = subscribeToUploadProgress(
			(progress: UploadProgress | null) => {
				setUploadProgress(progress);
			},
		);

		return unsubscribe;
	}, []);

	// 计算视图状态
	const viewState: PopupViewState = (() => {
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

		// 如果未认证
		if (!authState.isAuthenticated || !authState.isWorkspaceSelected) {
			return "AuthRequired";
		}

		// 如果有未上传的录像（Pending 状态）
		// TODO: 需要检查 IndexedDB
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

	const startUpload = useCallback(async (name: string) => {
		await setUploadCmd({
			name,
			workspaceCode: "default", // TODO: 从 auth state 获取
		});
	}, []);

	const cancelUpload = useCallback(async () => {
		// TODO: 取消上传命令
	}, []);

	const openNeo = useCallback(() => {
		window.open(config.neoUrl);
	}, [config.neoUrl]);

	const retryAuth = useCallback(() => {
		// TODO: 重新检查 auth 状态
		setAuthState({
			isAuthenticated: false,
			isWorkspaceSelected: false,
		});
	}, []);

	const openSettings = useCallback(() => {
		setShowSettings(true);
	}, []);

	const closeSettings = useCallback(() => {
		setShowSettings(false);
	}, []);

	const saveSettings = useCallback(async (newConfig: Config) => {
		await setConfig(newConfig);
		setConfigState(newConfig);
		setShowSettings(false);
	}, []);

	return {
		recordingState,
		uploadProgress,
		authState,
		viewState,
		config,
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
		openNeo,
		retryAuth,
		openSettings,
		closeSettings,
		saveSettings,
	};
}
