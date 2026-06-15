/**
 * Popup 控制器 Hook
 *
 * 组合所有子 hook，提供统一的接口
 */

import { useState } from "react";
import { DEFAULT_CONFIG, type Config } from "@/common/storage";
import { logger } from "@/common/logger";
import { useAuthState } from "./useAuthState";
import { useRecordingState, recordingActions } from "./useRecordingState";
import { useUploadState } from "./useUploadState";
import { useViewState } from "./useViewState";

// 导出子 hook 类型
export type { AuthState } from "./useAuthState";

export interface UsePopupControllerReturn {
	// 状态
	recordingState: ReturnType<typeof useRecordingState>["recordingState"];
	uploadProgress: ReturnType<typeof useUploadState>["uploadProgress"];
	authState: ReturnType<typeof useAuthState>["authState"];
	viewState: ReturnType<typeof useViewState>;
	config: Config;
	isLoading: ReturnType<typeof useAuthState>["isLoading"];

	// 上传便捷属性
	isUploading: boolean;
	uploadError: string | null;

	// 录制操作
	startRecording: () => Promise<void>;
	pauseRecording: () => Promise<void>;
	resumeRecording: () => Promise<void>;
	stopRecording: () => Promise<void>;
	clearRecording: ReturnType<typeof useRecordingState>["clearRecording"];

	// 上传操作
	showUploadInput: () => void;
	hideUploadInput: () => void;
	confirmUpload: (name: string) => Promise<void>;
	cancelUpload: ReturnType<typeof useUploadState>["cancelUpload"];

	// 其他操作
	openNeo: () => void;
	retryAuth: () => Promise<void>;
	openSettings: () => void;
	closeSettings: () => void;
	saveSettings: (config: Config) => void;
}

export function usePopupController(): UsePopupControllerReturn {
	const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
	const [showSettings, setShowSettings] = useState(false);

	// 子 hook
	const { authState, isLoading, retryAuth } = useAuthState();
	const { recordingState, clearRecording } = useRecordingState();
	const {
		uploadProgress,
		showUploadInput: showUploadInputState,
		isUploading,
		uploadError,
		showUploadInputView,
		hideUploadInputView,
		confirmUpload: doConfirmUpload,
		cancelUpload: doCancelUpload,
	} = useUploadState(recordingState.segmentCount);

	// 视图状态
	const viewState = useViewState({
		recordingState,
		uploadProgress,
		authState,
		isLoading,
		showSettings,
		showUploadInput: showUploadInputState,
		recordingSegmentCount: recordingState.segmentCount,
	});

	// 录制操作
	const startRecording = async () => {
		logger.ui.info("startRecording");
		await recordingActions.startRecording();
	};

	const pauseRecording = async () => {
		logger.ui.info("pauseRecording");
		await recordingActions.pauseRecording();
	};

	const resumeRecording = async () => {
		logger.ui.info("resumeRecording");
		await recordingActions.resumeRecording();
	};

	const stopRecording = async () => {
		logger.ui.info("stopRecording");
		await recordingActions.stopRecording();
	};

	// 上传操作
	const showUploadInput = () => showUploadInputView();
	const hideUploadInput = () => hideUploadInputView();

	const confirmUpload = async (name: string) => {
		const workspaceCode = authState.userInfo?.workspaceCode ?? "default";
		await doConfirmUpload(name, workspaceCode);
	};

	const cancelUpload = async () => {
		await doCancelUpload();
	};

	// 其他操作
	const openNeo = () => {
		browser.tabs.create({ url: config.neoUrl });
	};

	const openSettings = () => setShowSettings(true);
	const closeSettings = () => setShowSettings(false);
	const saveSettings = (newConfig: Config) => {
		setConfig(newConfig);
		setShowSettings(false);
	};

	return {
		// 状态
		recordingState,
		uploadProgress,
		authState,
		viewState,
		config,
		isLoading,

		// 上传便捷属性
		isUploading,
		uploadError,

		// 录制操作
		startRecording,
		pauseRecording,
		resumeRecording,
		stopRecording,
		clearRecording,

		// 上传操作
		showUploadInput,
		hideUploadInput,
		confirmUpload,
		cancelUpload,

		// 其他操作
		openNeo,
		retryAuth,
		openSettings,
		closeSettings,
		saveSettings,
	};
}
