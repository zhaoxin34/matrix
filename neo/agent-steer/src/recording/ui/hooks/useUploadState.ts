/**
 * 上传状态 Hook
 */

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/common/logger";
import type { UploadProgress } from "../../types";
import {
	startUpload as swStartUpload,
	getUploadProgress as getSWUploadProgress,
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
	recordingSegmentCount: number,
): UseUploadStateReturn {
	const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
		null,
	);
	const [showUploadInput, setShowUploadInput] = useState(false);

	// 轮询上传进度
	useEffect(() => {
		if (uploadProgress?.status !== "uploading") return;

		const pollInterval = setInterval(async () => {
			try {
				const progress = (await getSWUploadProgress()) as UploadProgress | null;
				if (progress) {
					setUploadProgress(progress);
				}
			} catch (e) {
				logger.ui.error("useUploadState: 轮询进度失败", e);
			}
		}, 1000);

		return () => clearInterval(pollInterval);
	}, [uploadProgress?.status]);

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
