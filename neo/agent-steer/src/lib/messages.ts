/**
 * Message API - Popup 与 Background Script 之间的通信
 */

import type {
	RecordingCmd,
	UploadCmd,
	UploadProgress,
	RecordingState,
} from "./types";

// Message types
export type MessageType =
	| "get-recording-state"
	| "set-recording-cmd"
	| "get-upload-progress"
	| "set-upload-cmd"
	| "get-auth-token"
	| "open-neo";

export interface Message {
	type: MessageType;
	payload?: unknown;
}

export interface MessageResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * 发送消息到 Background Script
 */
export async function sendMessage<T = unknown>(
	type: MessageType,
	payload?: unknown,
): Promise<MessageResponse<T>> {
	console.log("[messages] Sending message:", type, payload);

	// 检查 browser API 是否可用
	if (typeof browser === "undefined" && typeof chrome === "undefined") {
		console.error("[messages] No browser API available!");
		return { success: false, error: "No browser API available" };
	}

	const api = typeof browser !== "undefined" ? browser : chrome;

	return new Promise((resolve) => {
		try {
			api.runtime.sendMessage(
				{ type, payload },
				(response: MessageResponse<T>) => {
					console.log("[messages] Response:", response);
					resolve(response);
				},
			);
		} catch (error) {
			console.error("[messages] Send error:", error);
			resolve({ success: false, error: String(error) });
		}
	});
}

/**
 * 获取录制状态
 */
export async function getRecordingState(): Promise<RecordingState | null> {
	const response = await sendMessage<RecordingState>("get-recording-state");
	return response.success ? (response.data ?? null) : null;
}

/**
 * 设置录制命令
 */
export async function setRecordingCmd(cmd: RecordingCmd): Promise<void> {
	await sendMessage("set-recording-cmd", cmd);
}

/**
 * 获取上传进度
 */
export async function getUploadProgress(): Promise<UploadProgress | null> {
	const response = await sendMessage<UploadProgress>("get-upload-progress");
	return response.success ? (response.data ?? null) : null;
}

/**
 * 设置上传命令
 */
export async function setUploadCmd(cmd: UploadCmd): Promise<void> {
	await sendMessage("set-upload-cmd", cmd);
}

/**
 * 获取认证 Token
 */
export async function getAuthToken(): Promise<string | null> {
	const response = await sendMessage<string>("get-auth-token");
	return response.success ? (response.data ?? null) : null;
}

/**
 * 打开 Neo
 */
export async function openNeo(url: string): Promise<void> {
	await sendMessage("open-neo", { url });
}

/**
 * 监听来自 Background Script 的消息
 */
export function onMessage(
	callback: (message: Message) => MessageResponse | Promise<MessageResponse>,
): () => void {
	if (typeof browser === "undefined" && typeof chrome === "undefined") {
		return () => {};
	}

	const api = typeof browser !== "undefined" ? browser : chrome;

	const listener = (
		message: Message,
		_sender: unknown,
		sendResponse: (response: MessageResponse) => void,
	) => {
		console.log("[messages] Received message:", message);

		Promise.resolve(callback(message))
			.then((response) => {
				sendResponse(response);
			})
			.catch((error) => {
				sendResponse({ success: false, error: String(error) });
			});

		// 返回 true 表示异步响应
		return true;
	};

	api.runtime.onMessage.addListener(listener);

	return () => {
		api.runtime.onMessage.removeListener(listener);
	};
}
