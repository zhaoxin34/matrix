/**
 * Service Worker Uploader Module
 *
 * Handles uploading cancellation and data cleanup.
 */

import type { UploadProgress } from "../types";
import * as db from "../db/indexeddb";

// Storage API (兼容 browser 和 chrome)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _browser = typeof browser !== "undefined" ? browser : (chrome as any);
const storage = _browser?.storage;

/**
 * 更新上传进度
 */
async function updateProgress(progress: UploadProgress): Promise<void> {
	return new Promise((resolve) => {
		storage?.local?.set(
			{ "local:recording.uploadProgress": progress },
			resolve,
		);
	});
}

/**
 * 取消上传（导出供外部调用）
 */
export async function cancelUploadAction(): Promise<void> {
	await updateProgress({
		taskId: Date.now().toString(),
		status: "cancelled",
		progress: 0,
	});

	if (storage?.local) {
		storage.local.remove(["local:recording.uploadCmd"], () => {});
	}
}

/**
 * 清除所有录制数据（segments 和 sessions）
 */
export async function clearAllRecordingData(): Promise<void> {
	console.log("[uploader] Clearing all recording data");

	try {
		// 清除所有 segments
		await db.clearAllSegments();
		console.log("[uploader] All segments cleared");

		// 清除所有 sessions
		await db.clearAllSessions();
		console.log("[uploader] All sessions cleared");

		// 重置上传状态
		await updateProgress({
			taskId: Date.now().toString(),
			status: "cancelled",
			progress: 0,
		});

		if (storage?.local) {
			storage.local.remove(["local:recording.uploadCmd"], () => {});
		}

		console.log("[uploader] All recording data cleared successfully");
	} catch (error) {
		console.error("[uploader] Failed to clear recording data:", error);
		throw error;
	}
}