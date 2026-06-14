/**
 * Service Worker Uploader Module
 *
 * Handles uploading segments to Neo Backend API.
 * Polls for upload commands and manages the upload process.
 */

import type { UploadCmd, UploadProgress, Segment } from "../types";
import * as db from "../db/indexeddb";

// Storage API (兼容 browser 和 chrome)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _browser = typeof browser !== "undefined" ? browser : (chrome as any);
const storage = _browser?.storage;

// Storage keys (matching lib/storage.ts)
const STORAGE_KEYS = {
	UPLOAD_CMD: "recording.uploadCmd",
	UPLOAD_PROGRESS: "recording.uploadProgress",
} as const;

// Polling interval
const POLL_INTERVAL = 500; // ms

// Upload configuration
const NEO_BACKEND_URL = "http://localhost:8000";
const UPLOAD_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// State
let lastCmd: UploadCmd | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let uploadProgress: UploadProgress | null = null;
let isUploading = false;
let abortController: AbortController | null = null;

/**
 * 初始化上传模块
 */
export async function initUploader(): Promise<void> {
	console.log("[uploader] Initializing...");

	// 初始化 IndexedDB
	await db.initDB();

	// 启动命令轮询
	startPolling();

	console.log("[uploader] Initialized");
}

/**
 * 启动轮询
 */
function startPolling(): void {
	if (pollTimer) return;

	pollTimer = setInterval(async () => {
		try {
			const cmd = await getUploadCmd();
			if (cmd && JSON.stringify(cmd) !== JSON.stringify(lastCmd)) {
				lastCmd = cmd;
				await handleCommand(cmd);
			}
		} catch (error) {
			console.error("[uploader] Poll error:", error);
		}
	}, POLL_INTERVAL);
}

/**
 * 停止轮询
 */
function stopPolling(): void {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
}

/**
 * 获取上传命令
 */
async function getUploadCmd(): Promise<UploadCmd | null> {
	return new Promise((resolve) => {
		storage?.local?.get(
			[STORAGE_KEYS.UPLOAD_CMD],
			(result: Record<string, unknown>) => {
				const cmd = result[STORAGE_KEYS.UPLOAD_CMD] as UploadCmd | undefined;
				resolve(cmd || null);
			},
		);
	});
}

/**
 * 清除上传命令
 */
async function clearUploadCmd(): Promise<void> {
	return new Promise((resolve) => {
		storage?.local?.remove([STORAGE_KEYS.UPLOAD_CMD], resolve);
	});
}

/**
 * 更新上传进度
 */
async function updateProgress(progress: UploadProgress): Promise<void> {
	uploadProgress = progress;
	return new Promise((resolve) => {
		storage?.local?.set({ [STORAGE_KEYS.UPLOAD_PROGRESS]: progress }, resolve);
	});
}

/**
 * 处理上传命令
 */
async function handleCommand(cmd: UploadCmd): Promise<void> {
	console.log("[uploader] Handling upload command:", cmd.name);

	// 取消上传
	if ("action" in cmd && cmd.action === "cancel") {
		await cancelUpload();
		return;
	}

	// 开始上传
	await startUpload(cmd);
}

/**
 * 开始上传
 */
async function startUpload(cmd: UploadCmd): Promise<void> {
	if (isUploading) {
		console.log("[uploader] Already uploading");
		return;
	}

	isUploading = true;
	abortController = new AbortController();

	try {
		// 获取要上传的片段
		const sessionId = cmd.sessionId;
		let segments: Segment[];

		if (sessionId) {
			segments = await db.getSegmentsBySession(sessionId);
		} else {
			// 获取所有未同步的片段
			segments = await db.getUnsyncedSegments();
		}

		if (segments.length === 0) {
			await updateProgress({
				taskId: Date.now().toString(),
				status: "failed",
				progress: 0,
				error: "No segments to upload",
			});
			isUploading = false;
			return;
		}

		// 获取 workspace token
		const token = await getAuthToken();
		if (!token) {
			await updateProgress({
				taskId: Date.now().toString(),
				status: "failed",
				progress: 0,
				error: "Not authenticated",
			});
			isUploading = false;
			return;
		}

		// 更新状态为上传中
		await updateProgress({
			taskId: Date.now().toString(),
			status: "uploading",
			progress: 0,
			currentSegment: 0,
			totalSegments: segments.length,
		});

		// 创建 recording
		const recordingUid = await createRecording(
			cmd.workspaceCode,
			segments[0].pageUrls[0] || "",
			token,
		);

		if (!recordingUid) {
			await updateProgress({
				taskId: Date.now().toString(),
				status: "failed",
				progress: 0,
				error: "Failed to create recording",
			});
			isUploading = false;
			return;
		}

		// 上传片段
		let uploadedCount = 0;
		for (const segment of segments) {
			// 检查是否被取消
			if (abortController.signal.aborted) {
				console.log("[uploader] Upload cancelled");
				await updateProgress({
					taskId: Date.now().toString(),
					status: "cancelled",
					progress: (uploadedCount / segments.length) * 100,
					currentSegment: uploadedCount,
					totalSegments: segments.length,
				});
				isUploading = false;
				return;
			}

			// 上传片段
			const success = await uploadSegment(
				segment,
				recordingUid,
				token,
				cmd.workspaceCode,
			);

			if (success) {
				uploadedCount++;
				await db.markSegmentSynced(segment.uid);

				// 更新进度
				await updateProgress({
					taskId: Date.now().toString(),
					status: "uploading",
					progress: (uploadedCount / segments.length) * 100,
					currentSegment: uploadedCount,
					totalSegments: segments.length,
					recordingUid,
				});
			}
		}

		// 完成录制
		const lastSegment = segments[segments.length - 1];
		const exitUrl = lastSegment.pageUrls[lastSegment.pageUrls.length - 1] || "";
		await completeRecording(recordingUid, exitUrl, token, cmd.workspaceCode);

		// 更新状态为完成
		await updateProgress({
			taskId: Date.now().toString(),
			status: "completed",
			progress: 100,
			currentSegment: uploadedCount,
			totalSegments: segments.length,
			recordingUid,
		});

		console.log("[uploader] Upload completed");
	} catch (error) {
		console.error("[uploader] Upload failed:", error);
		await updateProgress({
			taskId: Date.now().toString(),
			status: "failed",
			progress: 0,
			error: error instanceof Error ? error.message : "Upload failed",
		});
	} finally {
		isUploading = false;
		abortController = null;
		await clearUploadCmd();
		lastCmd = null;
	}
}

/**
 * 创建 recording
 */
async function createRecording(
	workspaceCode: string,
	enterUrl: string,
	token: string,
): Promise<string | null> {
	try {
		const response = await fetchWithTimeout(
			`${NEO_BACKEND_URL}/api/v1/workspaces/${workspaceCode}/recordings`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					enterUrl,
					source: "agent",
				}),
				signal: abortController?.signal,
			},
		);

		if (!response.ok) {
			console.error("[uploader] Failed to create recording:", response.status);
			return null;
		}

		const data = await response.json();
		return data.uid;
	} catch (error) {
		console.error("[uploader] Failed to create recording:", error);
		return null;
	}
}

/**
 * 上传片段
 */
async function uploadSegment(
	segment: Segment,
	recordingUid: string,
	token: string,
	workspaceCode: string,
): Promise<boolean> {
	let retries = 0;

	while (retries < MAX_RETRIES) {
		try {
			// 1. 创建片段记录
			const segmentResponse = await fetchWithTimeout(
				`${NEO_BACKEND_URL}/api/v1/workspaces/${workspaceCode}/recordings/${recordingUid}/segments`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						sequence: segment.sequence,
						startTime: new Date(segment.startTime).toISOString(),
						endTime: new Date(segment.endTime).toISOString(),
						eventCount: segment.eventCount,
						pageUrls: segment.pageUrls,
					}),
					signal: abortController?.signal,
				},
			);

			if (!segmentResponse.ok) {
				console.error(
					"[uploader] Failed to create segment:",
					segmentResponse.status,
				);
				retries++;
				continue;
			}

			const segmentData = await segmentResponse.json();
			const segUid = segmentData.uid;

			// 2. 上传片段数据
			const bytesResponse = await fetchWithTimeout(
				`${NEO_BACKEND_URL}/api/v1/workspaces/${workspaceCode}/recordings/${recordingUid}/segments/${segUid}/bytes`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: segment.events, // JSON string of events
					signal: abortController?.signal,
				},
			);

			if (!bytesResponse.ok) {
				console.error(
					"[uploader] Failed to upload segment bytes:",
					bytesResponse.status,
				);
				retries++;
				continue;
			}

			console.log("[uploader] Segment uploaded:", segment.uid);
			return true;
		} catch (error) {
			console.error("[uploader] Segment upload error:", error);
			retries++;

			if (retries < MAX_RETRIES) {
				console.log(`[uploader] Retrying in ${RETRY_DELAY}ms...`);
				await sleep(RETRY_DELAY);
			}
		}
	}

	return false;
}

/**
 * 完成录制
 */
async function completeRecording(
	recordingUid: string,
	exitUrl: string,
	token: string,
	workspaceCode: string,
): Promise<boolean> {
	try {
		const response = await fetchWithTimeout(
			`${NEO_BACKEND_URL}/api/v1/workspaces/${workspaceCode}/recordings/${recordingUid}/complete`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ exitUrl }),
				signal: abortController?.signal,
			},
		);

		return response.ok;
	} catch (error) {
		console.error("[uploader] Failed to complete recording:", error);
		return false;
	}
}

/**
 * 取消上传
 */
async function cancelUpload(): Promise<void> {
	if (abortController) {
		abortController.abort();
	}

	await updateProgress({
		taskId: Date.now().toString(),
		status: "cancelled",
		progress: 0,
	});

	await clearUploadCmd();
	lastCmd = null;
	isUploading = false;
}

/**
 * 获取认证 token
 */
async function getAuthToken(): Promise<string | null> {
	return new Promise((resolve) => {
		storage?.local?.get(["auth.token"], (result: Record<string, unknown>) => {
			const token = result["auth.token"];
			resolve(typeof token === "string" ? token : null);
		});
	});
}

/**
 * 带超时的 fetch
 */
async function fetchWithTimeout(
	url: string,
	options: RequestInit & { timeout?: number },
): Promise<Response> {
	const { timeout = UPLOAD_TIMEOUT, ...fetchOptions } = options;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			...fetchOptions,
			signal: AbortSignal.any([
				controller.signal,
				fetchOptions.signal || new AbortController().signal,
			]),
		});
		return response;
	} finally {
		clearTimeout(timeoutId);
	}
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 获取当前上传进度
 */
export function getProgress(): UploadProgress | null {
	return uploadProgress ? { ...uploadProgress } : null;
}

/**
 * 清理资源
 */
export function cleanup(): void {
	stopPolling();
	if (abortController) {
		abortController.abort();
	}
}
