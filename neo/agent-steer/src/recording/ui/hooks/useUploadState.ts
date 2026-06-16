/**
 * 上传状态 Hook
 *
 * 数据源: Content Script 通过 chrome.runtime.sendMessage 推送 upload-progress,
 * Popup 在这里 chrome.runtime.onMessage 监听。
 */

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/common/logger";
import type { UploadProgress } from "../../types";
import {
	startUpload as swStartUpload,
	cancelUpload as swCancelUpload,
} from "../../index";

interface UseUploadStateReturn {
	uploadProgress: UploadProgress | null;
	showUploadInput: boolean;
	isUploading: boolean;
	uploadError: string | null;
	showUploadInputView: () => void;
	hideUploadInputView: () => void;
	confirmUpload: (name: string, workspaceCode: string) => Promise<void>;
	cancelUpload: () => Promise<void>;
}

export function useUploadState(
	_recordingSegmentCount: number,
): UseUploadStateReturn {
	const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
		null,
	);
	const [showUploadInput, setShowUploadInput] = useState(false);

	// 监听 CS 通过 chrome.runtime.sendMessage 推送的 upload-progress
	useEffect(() => {
		const listener = (message: unknown) => {
			const m = message as {
				direction?: string;
				type?: string;
				payload?: UploadProgress;
			};
			if (
				m?.direction === "cs→popup" &&
				m?.type === "upload-progress" &&
				m.payload
			) {
				logger.ui.debug("useUploadState: 收到 upload-progress", m.payload);
				setUploadProgress(m.payload);
			}
		};
		chrome.runtime.onMessage.addListener(listener);
		return () => {
			chrome.runtime.onMessage.removeListener(listener);
		};
	}, []);

	const showUploadInputView = useCallback(() => {
		logger.ui.info("showUploadInput: 显示上传输入界面");
		setShowUploadInput(true);
	}, []);

	const hideUploadInputView = useCallback(() => {
		setShowUploadInput(false);
	}, []);

	const confirmUpload = useCallback(
		async (name: string, workspaceCode: string) => {
			logger.ui.info("confirmUpload:", name);
			setShowUploadInput(false);

			// 立刻设一个 uploading 状态,让 UI 切到 Uploading 视图
			setUploadProgress({
				taskId: `upload_${Date.now()}`,
				status: "uploading",
				progress: 0,
			});

			const result = await swStartUpload(name, workspaceCode);
			if (!result.success) {
				setUploadProgress({
					taskId: `upload_${Date.now()}`,
					status: "failed",
					progress: 0,
					error: result.error ?? "上传失败",
				});
			}
			// 成功时 progress 由 CS 推送过来,这里不更新
		},
		[],
	);

	const cancelUpload = useCallback(async () => {
		logger.ui.info("cancelUpload: 取消上传");
		setShowUploadInput(false);
		await swCancelUpload();
		setUploadProgress(null);
	}, []);

	// 计算属性
	const isUploading = uploadProgress?.status === "uploading";
	const uploadError =
		uploadProgress?.status === "failed"
			? (uploadProgress.error ?? "上传失败")
			: null;

	return {
		uploadProgress,
		showUploadInput,
		isUploading,
		uploadError,
		showUploadInputView,
		hideUploadInputView,
		confirmUpload,
		cancelUpload,
	};
}
