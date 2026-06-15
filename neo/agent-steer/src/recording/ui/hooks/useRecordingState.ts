/**
 * useRecordingState - 管理录制状态的 React Hook
 *
 * 职责：
 * 1. 管理录制状态（从 CS 推送接收）
 * 2. 管理上传进度
 * 3. 处理用户操作（通过 SW 通信层发送命令）
 */

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/common/logger";
import type {
	RecordingState,
	UploadProgress,
	PopupViewState,
	CSToPopupMessage,
} from "../../types";
import { DEFAULT_CONFIG, TEST_USER_INFO, type Config } from "@/common/storage";
import { fetchAuthState, type UserInfo } from "@/common/auth";
import {
	startRecording as swStartRecording,
	pauseRecording as swPauseRecording,
	resumeRecording as swResumeRecording,
	stopRecording as swStopRecording,
	getRecordingState as getSWRecordingState,
	startUpload as swStartUpload,
	getUploadProgress as getSWUploadProgress,
	cancelUpload as swCancelUpload,
	clearRecording as swClearRecording,
	addStateListener,
} from "../../index";

// ==================== 类型 ====================

interface AuthState {
	isAuthenticated: boolean;
	isWorkspaceSelected: boolean;
	userInfo: UserInfo | null;
}

// 默认状态
const DEFAULT_RECORDING_STATE: RecordingState = {
	isRecording: false,
	isPaused: false,
	duration: 0,
	segmentCount: 0,
	eventCount: 0,
};

// ==================== Hook ====================

export function useRecordingState() {
	const [recordingState, setRecordingState] = useState<RecordingState>(
		DEFAULT_RECORDING_STATE,
	);
	const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
		null,
	);
	const [authState, setAuthState] = useState<AuthState>({
		isAuthenticated: false,
		isWorkspaceSelected: false,
		userInfo: null,
	});
	const [config, setConfigState] = useState<Config>(DEFAULT_CONFIG);
	const [showSettings, setShowSettings] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// 用于上传流程：显示输入名称界面
	const [showUploadInput, setShowUploadInput] = useState(false);

	// ==================== 初始化 ====================

	useEffect(() => {
		const init = async () => {
			setIsLoading(true);

			// 获取录制状态（安全处理）
			try {
				const state = (await getSWRecordingState()) as RecordingState | null;
				logger.ui.debug("初始录制状态:", state);
				if (state && typeof state.isRecording === "boolean") {
					setRecordingState({
						isRecording: state.isRecording,
						isPaused: state.isPaused ?? false,
						duration: state.duration ?? 0,
						segmentCount: state.segmentCount ?? 0,
						eventCount: state.eventCount ?? 0,
					});
				}
			} catch (e) {
				logger.ui.error("获取录制状态失败:", e);
			}

			// 获取上传进度
			try {
				const progress = (await getSWUploadProgress()) as UploadProgress | null;
				setUploadProgress(progress ?? null);
			} catch (e) {
				logger.ui.error("获取上传进度失败:", e);
			}

			// 测试模式
			if (DEFAULT_CONFIG.testMode) {
				logger.ui.debug("测试模式已启用");
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

	// ==================== 监听 CS 状态推送 ====================

	useEffect(() => {
		logger.ui.debug("设置 CS 状态监听器");

		const handleStateUpdate = (state: RecordingState) => {
			logger.ui.debug("收到 CS 状态更新:", state);
			setRecordingState(state);
		};

		// 添加监听器
		const unsubscribe = addStateListener(handleStateUpdate);

		// 监听 CS 推送的消息
		const messageListener = (message: unknown) => {
			const msg = message as CSToPopupMessage;
			if (msg?.direction === "cs→popup") {
				if (msg.type === "state-update") {
					logger.ui.debug("收到 CS 状态推送:", msg.state);
					setRecordingState({
						isRecording: msg.state.isRecording,
						isPaused: msg.state.isPaused,
						duration: msg.state.duration,
						segmentCount: msg.state.segmentCount,
						eventCount: msg.state.eventCount,
						sessionId: msg.state.sessionId ?? undefined,
					});
				} else if (msg.type === "recording-response") {
					logger.ui.debug("收到 CS 命令响应:", msg);
					// 可以在这里显示 toast 或其他 UI 反馈
				}
			}
		};

		chrome.runtime.onMessage.addListener(messageListener);

		return () => {
			unsubscribe();
			chrome.runtime.onMessage.removeListener(messageListener);
		};
	}, []);

	// ==================== 视图状态计算 ====================

	const viewState: PopupViewState = (() => {
		if (isLoading) return "Loading";
		if (showSettings) return "Settings";
		if (showUploadInput) return "UploadInput";
		if (uploadProgress?.status === "uploading") return "Uploading";
		if (uploadProgress?.status === "completed") return "Success";
		if (uploadProgress?.status === "failed") return "Error";
		if (!authState.isAuthenticated || !authState.isWorkspaceSelected) {
			return "AuthRequired";
		}
		if (recordingState.segmentCount > 0 && !recordingState.isRecording) {
			return "Pending";
		}
		if (recordingState.isRecording && !recordingState.isPaused) {
			return "Recording";
		}
		if (recordingState.isPaused) return "Paused";
		return "Idle";
	})();

	// ==================== 操作函数 ====================

	const startRecording = useCallback(async () => {
		logger.ui.info("startRecording: 开始录制");
		const result = await swStartRecording();
		if (result.success) {
			logger.ui.debug(
				"startRecording: 命令已发送, requestId:",
				result.requestId,
			);
		} else {
			logger.ui.error("startRecording: 失败:", result.error);
		}
	}, []);

	const pauseRecording = useCallback(async () => {
		logger.ui.info("pauseRecording: 暂停录制");
		const result = await swPauseRecording();
		logger.ui.debug("pauseRecording: ", result.success ? "成功" : "失败");
	}, []);

	const resumeRecording = useCallback(async () => {
		logger.ui.info("resumeRecording: 恢复录制");
		const result = await swResumeRecording();
		logger.ui.debug("resumeRecording: ", result.success ? "成功" : "失败");
	}, []);

	const stopRecording = useCallback(async () => {
		logger.ui.info("stopRecording: 停止录制");
		const result = await swStopRecording();
		logger.ui.debug("stopRecording: ", result.success ? "成功" : "失败");
	}, []);

	const startUpload = useCallback(async (_name: string) => {
		// 这个函数现在只是占位符，实际逻辑在 showUploadInput 和 confirmUpload 中
		logger.ui.info("startUpload: (deprecated, use showUploadInput)");
	}, []);

	// 显示上传输入界面（点击上传按钮时调用）
	const handleShowUploadInput = useCallback(() => {
		logger.ui.info("handleShowUploadInput: 显示上传输入界面");
		setShowUploadInput(true);
	}, []);

	// 确认上传（用户输入名称后点击确认）
	const confirmUpload = useCallback(
		async (name: string) => {
			logger.ui.info("confirmUpload:", name);

			// 隐藏输入界面
			setShowUploadInput(false);

			// 开始上传
			setUploadProgress({
				taskId: `upload_${Date.now()}`,
				status: "uploading",
				progress: 0,
			});

			const result = await swStartUpload(
				name,
				authState.userInfo?.workspaceCode ?? "default",
			);
			logger.ui.debug("confirmUpload: ", result.success ? "成功" : "失败");

			// 如果失败，更新状态
			if (!result.success) {
				setUploadProgress({
					taskId: `upload_${Date.now()}`,
					status: "failed",
					progress: 0,
					error: result.error ?? "上传失败",
				});
			}
		},
		[authState.userInfo],
	);

	// 取消上传
	const cancelUpload = useCallback(async () => {
		logger.ui.info("cancelUpload: 取消上传");

		// 隐藏输入界面
		setShowUploadInput(false);

		// 调用 SW 取消上传
		const result = await swCancelUpload();

		// 重置上传状态
		setUploadProgress(null);

		logger.ui.debug("cancelUpload: 已取消", result.success ? "成功" : "失败");
	}, []);

	// 清除录制数据（回到 Idle 状态）
	const clearRecording = useCallback(async () => {
		logger.ui.info("clearRecording: 清除录制数据");

		// 调用 SW 清除录制数据
		const result = await swClearRecording();

		if (result.success) {
			// 重置本地录制状态
			setRecordingState({
				isRecording: false,
				isPaused: false,
				duration: 0,
				segmentCount: 0,
				eventCount: 0,
			});

			// 重置上传状态
			setUploadProgress(null);

			// 隐藏上传输入界面
			setShowUploadInput(false);

			logger.ui.debug("clearRecording: 清除成功");
		} else {
			logger.ui.error("clearRecording: 清除失败", result.error);
		}
	}, []);

	const openNeo = useCallback(() => {
		logger.ui.info("openNeo: 打开 Neo");
		browser.tabs.create({ url: config.neoUrl });
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
		logger.ui.info("saveSettings: 保存设置");
		setConfigState(newConfig);
		setShowSettings(false);
		// TODO: 持久化配置
	}, []);

	// ==================== 轮询上传进度 ====================
	useEffect(() => {
		if (viewState !== "Uploading") return;

		logger.ui.debug("开始轮询上传进度");
		const pollInterval = setInterval(async () => {
			try {
				const progress = (await getSWUploadProgress()) as UploadProgress | null;
				if (progress) {
					setUploadProgress(progress);
					logger.ui.debug("轮询获取上传进度:", progress.progress);
				}
			} catch (e) {
				logger.ui.error("轮询上传进度失败:", e);
			}
		}, 1000);

		return () => {
			logger.ui.debug("停止轮询上传进度");
			clearInterval(pollInterval);
		};
	}, [viewState]);

	// ==================== 返回 ====================

	return {
		// 状态
		recordingState,
		uploadProgress,
		authState,
		viewState,
		config,
		isLoading,

		// 上传状态
		isUploading: uploadProgress?.status === "uploading",
		uploadError:
			uploadProgress?.status === "failed"
				? (uploadProgress.error ?? "上传失败")
				: null,

		// 操作
		startRecording,
		pauseRecording,
		resumeRecording,
		stopRecording,
		startUpload,
		showUploadInput: handleShowUploadInput,
		confirmUpload,
		cancelUpload,
		clearRecording,
		openNeo,
		retryAuth,
		openSettings,
		closeSettings,
		saveSettings,
	};
}

// 导出类型
export type { AuthState };
