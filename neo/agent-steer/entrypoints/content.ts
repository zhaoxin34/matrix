/**
 * Content Script Entry Point
 *
 * 职责：
 * 1. 通过 background script 注入 recorder.js 到主世界
 * 2. 通过 postMessage 与 recorder 通信
 * 3. 通过 WXT storage 与 popup 通信
 */

import { storage } from "#imports";
import { STORAGE_KEYS } from "../src/recording/messages";

// Storage keys
const STORAGE = {
	RECORDING_CMD: STORAGE_KEYS.RECORDING_CMD,
	RECORDING_STATE: STORAGE_KEYS.RECORDING_STATE,
} as const;

// State
let isRecorderInjected = false;
let messageIdCounter = 0;
const pendingMessages = new Map<
	number,
	{ resolve: (value: unknown) => void; reject: (error: Error) => void }
>();

// ==================== Recorder Injection ====================

async function injectRecorder(): Promise<boolean> {
	if (isRecorderInjected) {
		return true;
	}

	console.log("[content] Requesting recorder injection via background...");

	try {
		// 通过 background script 注入
		const response = await browser.runtime.sendMessage({
			type: "injectRecorder",
		});

		if (response?.success) {
			console.log("[content] Recorder injected successfully");
			isRecorderInjected = true;
			return true;
		} else {
			console.error("[content] Recorder injection failed:", response?.error);
			return false;
		}
	} catch (error) {
		console.error("[content] Failed to request injection:", error);
		return false;
	}
}

// ==================== Recorder Communication ====================

function sendToRecorder(action: string, payload?: unknown): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const id = ++messageIdCounter;
		pendingMessages.set(id, { resolve, reject });

		const sendMessage = () => {
			window.postMessage(
				{
					source: "recorder-control",
					type: "request",
					id,
					action,
					payload,
				},
				"*",
			);
		};

		if (!isRecorderInjected) {
			// 先请求注入，再发送
			injectRecorder().then((success) => {
				if (success) {
					// 等待一小段时间让脚本初始化
					setTimeout(sendMessage, 1000);
				} else {
					pendingMessages.delete(id);
					reject(new Error("Failed to inject recorder"));
				}
			});
		} else {
			sendMessage();
		}

		// 超时
		setTimeout(() => {
			if (pendingMessages.has(id)) {
				pendingMessages.delete(id);
				reject(new Error("Message timeout"));
			}
		}, 10000);
	});
}

// 监听 recorder 的响应
window.addEventListener("message", (event) => {
	if (event.source !== window) return;
	if (!event.data || event.data.source !== "recorder-response") return;

	const { id, success, result, error } = event.data;
	const pending = pendingMessages.get(id);

	if (pending) {
		pendingMessages.delete(id);
		if (success) {
			pending.resolve(result);
		} else {
			pending.reject(new Error(error || "Unknown error"));
		}
	}
});

// ==================== State Management ====================

interface RecordingState {
	isRecording: boolean;
	isPaused: boolean;
	sessionId: string | null;
	segmentUid: string | null;
	eventCount: number;
	segmentCount: number;
}

async function updateRecordingState(
	partial: Partial<RecordingState>,
): Promise<RecordingState> {
	const current = (await storage.getItem<RecordingState>(
		STORAGE.RECORDING_STATE,
	)) || {
		isRecording: false,
		isPaused: false,
		sessionId: null,
		segmentUid: null,
		eventCount: 0,
		segmentCount: 0,
	};

	const state: RecordingState = {
		isRecording: partial.isRecording ?? current.isRecording,
		isPaused: partial.isPaused ?? current.isPaused,
		sessionId:
			partial.sessionId !== undefined ? partial.sessionId : current.sessionId,
		segmentUid:
			partial.segmentUid !== undefined
				? partial.segmentUid
				: current.segmentUid,
		eventCount: partial.eventCount ?? current.eventCount,
		segmentCount: partial.segmentCount ?? current.segmentCount,
	};

	await storage.setItem(STORAGE.RECORDING_STATE, state);
	return state;
}

// ==================== Command Handling ====================

async function handleStart() {
	console.log("[content] Starting recording...");

	// 确保 recorder 已注入
	const injected = await injectRecorder();
	if (!injected) {
		console.error("[content] Failed to inject recorder");
		await updateRecordingState({ isRecording: false });
		return;
	}

	// 等待一小段时间让 recorder 初始化
	await new Promise((resolve) => setTimeout(resolve, 500));

	const result = (await sendToRecorder("start")) as {
		success: boolean;
		sessionId?: string;
		error?: string;
	};

	if (result.success && result.sessionId) {
		await updateRecordingState({
			isRecording: true,
			isPaused: false,
			sessionId: result.sessionId,
		});
		console.log("[content] Recording started successfully");
	} else {
		console.error("[content] Failed to start recording:", result.error);
		await updateRecordingState({
			isRecording: false,
		});
	}
}

async function handlePause() {
	await sendToRecorder("pause");
	await updateRecordingState({ isPaused: true });
	console.log("[content] Recording paused");
}

async function handleResume() {
	await sendToRecorder("resume");
	await updateRecordingState({ isPaused: false });
	console.log("[content] Recording resumed");
}

async function handleStop() {
	await sendToRecorder("stop");
	await updateRecordingState({
		isRecording: false,
		isPaused: false,
		sessionId: null,
		segmentUid: null,
	});
	console.log("[content] Recording stopped");
}

async function syncStatus() {
	try {
		const status = (await sendToRecorder("status")) as {
			isRecording: boolean;
			isPaused: boolean;
			sessionId: string | null;
			eventCount: number;
			segmentCount: number;
		};

		await updateRecordingState({
			isRecording: status.isRecording,
			isPaused: status.isPaused,
			sessionId: status.sessionId,
			eventCount: status.eventCount,
			segmentCount: status.segmentCount,
		});
	} catch (error) {
		// 忽略同步错误
	}
}

async function handleCommand() {
	const cmd = await storage.getItem<{ action?: string }>(STORAGE.RECORDING_CMD);
	if (!cmd?.action) return;

	console.log("[content] Handling command:", cmd.action);

	switch (cmd.action) {
		case "start":
			await handleStart();
			break;
		case "pause":
			await handlePause();
			break;
		case "resume":
			await handleResume();
			break;
		case "stop":
			await handleStop();
			break;
		case "sync":
			await syncStatus();
			break;
		default:
			console.warn("[content] Unknown command:", cmd.action);
	}

	// 清除命令
	await storage.setItem(STORAGE.RECORDING_CMD, null);
}

// ==================== Initialization ====================

async function init() {
	console.log("[content] Initializing...");

	// 注入 recorder
	await injectRecorder();

	// 同步当前状态
	await syncStatus();

	// 轮询命令
	const pollInterval = window.setInterval(handleCommand, 1000);

	// 轮询状态更新
	const statusInterval = window.setInterval(syncStatus, 5000);

	// 清理
	self.addEventListener("unload", () => {
		window.clearInterval(pollInterval);
		window.clearInterval(statusInterval);
	});

	console.log("[content] Initialized");
}

// WXT Content Script 入口
export default defineContentScript({
	matches: ["<all_urls>"],
	runAt: "document_start",
	main() {
		init();
	},
});
