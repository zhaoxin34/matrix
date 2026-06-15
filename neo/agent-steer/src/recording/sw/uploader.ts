/**
 * Service Worker Uploader Module
 *
 * Handles uploading cancellation and data cleanup.
 */

import { setRecordingState } from "../messages";
import * as db from "../db/indexeddb";

/**
 * 取消上传（导出供外部调用）
 */
export async function cancelUploadAction(): Promise<void> {
	// 重置录制状态
	await setRecordingState({
		status: "idle",
		duration: 0,
		segmentCount: 0,
		eventCount: 0,
	});
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

		console.log("[uploader] All recording data cleared successfully");
	} catch (error) {
		console.error("[uploader] Failed to clear recording data:", error);
		throw error;
	}
}
