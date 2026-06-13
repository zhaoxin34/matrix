/**
 * useRecordingState - 管理录制状态的 React Hook
 */

import { useState, useEffect, useCallback } from "react";
import type {
	RecordingState,
	UploadProgress,
	PopupViewState,
} from "../../types";
import { DEFAULT_CONFIG, type Config } from "@/lib/storage";
import {
	getRecordingState,
	subscribeToRecordingState,
	subscribeToUploadProgress,
	setRecordingCmd,
	setUploadCmd,
	getConfig,
	setConfig,
} from "@/lib/storage";
import { fetchAuthState, type UserInfo } from "../../auth/iframe-bridge";

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

// 默认状态
const DEFAULT_RECORDING_STATE: RecordingState = {
	isRecording: false,
	isPaused: false,
	duration: 0,
	segmentCount: 0,
	eventCount: 0,
};

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

			// 获取配置
			const cfg = await getConfig();
			setConfigState(cfg);

			// 获取录制状态
			const state = await getRecordingState();
			setRecordingState(state);

			// 通过 iframe 获取认证状态
			const auth = await fetchAuthState();
			setAuthState({
				isAuthenticated: auth.isAuthenticated,
				isWorkspaceSelected: auth.isWorkspaceSelected,
				userInfo: auth.userInfo,
			});

			setIsLoading(false);
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

	const startUpload = useCallback(
		async (name: string) => {
			await setUploadCmd({
				name,
				workspaceCode: authState.userInfo?.workspaceCode ?? "default",
			});
		},
		[authState.userInfo],
	);

	const cancelUpload = useCallback(async () => {
		// TODO: 取消上传命令
	}, []);

	const openNeo = useCallback(() => {
		window.open(config.neoUrl);
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
		openNeo,
		retryAuth,
		openSettings,
		closeSettings,
		saveSettings,
	};
}
