/**
 * Content Script 通信层
 *
 * 职责：
 * 1. CS 端：发送命令到 rrweb，接收响应
 * 2. CS 端：主动推送状态到 Popup
 * 3. CS 端：接收来自 SW 路由的命令并执行
 *
 * 使用 chrome.runtime.sendMessage 与 Popup 通信
 */

import { logger } from "@/common/logger";
import { STORAGE_KEYS } from "@/common/storage";
import { storage } from "#imports";
import type {
	CSToPopupMessage,
	PopupToCSMessage,
	RecordingState,
} from "../types";

// ==================== 类型定义 ====================

/** 状态监听回调 */
type StateListener = (state: RecordingState) => void;

/** 响应监听回调 */
type ResponseListener = (response: {
	success: boolean;
	sessionId?: string;
	error?: string;
}) => void;

// ==================== 常量 ====================

/** 消息源标识 - 从 CS 发出 */
const MESSAGE_SOURCE_CS = "recorder-control";

/** 消息源标识 - 从 rrweb recorder 响应 */
const MESSAGE_SOURCE_RRWEB = "recorder-response";

// ==================== 定时器 ====================

/** 定时器 ID */
let updateTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 开始定时器，每秒更新录制时长
 */
function startUpdateTimer(): void {
	if (updateTimer) return;

	logger.cs.debug("开始录制时长更新定时器");
	updateTimer = setInterval(() => {
		// 只有在录制中且未暂停时才更新时间
		if (
			currentState.isRecording &&
			!currentState.isPaused &&
			currentState.startTime
		) {
			const duration = Date.now() - currentState.startTime;
			currentState = { ...currentState, duration };
			pushStateToPopup();
		}
	}, 1000);
}

/**
 * 停止定时器
 */
function stopUpdateTimer(): void {
	if (updateTimer) {
		clearInterval(updateTimer);
		updateTimer = null;
		logger.cs.debug("停止录制时长更新定时器");
	}
}

// ==================== 状态管理 ====================

/** 当前录制状态 */
let currentState: RecordingState = {
	isRecording: false,
	isPaused: false,
	duration: 0,
	segmentCount: 0,
	eventCount: 0,
	sessionId: undefined,
	startTime: undefined,
};

/** 状态监听器列表 */
const stateListeners = new Set<StateListener>();

/** 响应监听器列表（按 requestId）*/
const responseListeners = new Map<string, ResponseListener>();

/** 是否已初始化 */
let isInitialized = false;

// ==================== 内部 rrweb 通信 ====================

/** rrweb 消息 ID 计数器 */
let rrwebMessageIdCounter = 0;

/** 等待 rrweb 响应的 pending 消息 */
const pendingRRWebMessages = new Map<
	number,
	{ resolve: (value: unknown) => void; reject: (error: Error) => void }
>();

/**
 * 发送消息到 rrweb recorder
 */
function sendToRRWeb(action: string, payload?: unknown): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const id = ++rrwebMessageIdCounter;
		pendingRRWebMessages.set(id, { resolve, reject });

		logger.cs.info("发送消息到 rrweb:", { id, action, payload });

		window.postMessage(
			{
				source: MESSAGE_SOURCE_CS,
				type: "request",
				id,
				action,
				payload,
			},
			"*",
		);

		// 超时 10 秒
		setTimeout(() => {
			if (pendingRRWebMessages.has(id)) {
				pendingRRWebMessages.delete(id);
				logger.cs.error(`rrweb 消息超时: ${action}`);
				reject(new Error(`Message timeout: ${action}`));
			}
		}, 10000);
	});
}

/**
 * 设置 rrweb 监听器
 */
function setupRRWebListener(): void {
	window.addEventListener("message", (event) => {
		if (event.source !== window) return;
		if (!event.data) return;

		logger.cs.debug("收到 window.message:", event.data.source);

		// 处理 segment-saved 消息（来自 recorder）
		if (
			event.data.source === "recorder-state" &&
			event.data.type === "segment-saved"
		) {
			logger.cs.info("收到 segment 保存通知:", event.data);
			// 更新 segmentCount
			notifyStateChange({
				segmentCount: event.data.segmentSequence,
			});
			return;
		}

		if (event.data.source !== MESSAGE_SOURCE_RRWEB) return;

		const { id, success, result, error } = event.data;
		const pending = pendingRRWebMessages.get(id);

		if (pending) {
			pendingRRWebMessages.delete(id);
			logger.cs.info("收到 rrweb 响应:", { id, success, result });
			if (success) {
				pending.resolve(result);
			} else {
				pending.reject(new Error(error || "Unknown error"));
			}
		}
	});
}

// ==================== 状态推送 ====================

/**
 * 更新状态并通知所有监听器
 */
function notifyStateChange(state: Partial<RecordingState>): void {
	currentState = { ...currentState, ...state };
	logger.cs.debug("状态更新:", currentState);

	for (const listener of stateListeners) {
		try {
			listener(currentState);
		} catch (e) {
			logger.cs.error("状态监听器执行失败:", e);
		}
	}

	// 推送状态到 Popup
	pushStateToPopup();

	// 同步状态到 storage（供 SW 读取）
	syncStateToStorage();
}

/**
 * 同步状态到 storage
 */
async function syncStateToStorage(): Promise<void> {
	try {
		await storage.setItem(STORAGE_KEYS.RECORDING_STATE, currentState);
		logger.cs.debug("状态已同步到 storage");
	} catch (e) {
		logger.cs.error("状态同步到 storage 失败:", e);
	}
}

/**
 * 推送状态到 Popup
 */
function pushStateToPopup(): void {
	const message: CSToPopupMessage = {
		direction: "cs→popup",
		type: "state-update",
		state: {
			isRecording: currentState.isRecording,
			isPaused: currentState.isPaused,
			sessionId: currentState.sessionId ?? null,
			segmentUid: null,
			eventCount: currentState.eventCount,
			segmentCount: currentState.segmentCount,
			duration: currentState.duration,
		},
	};

	chrome.runtime.sendMessage(message).catch((e) => {
		logger.cs.debug("推送状态到 Popup 失败:", e);
	});
}

/**
 * 发送命令响应到 Popup
 */
function pushCommandResponseToPopup(
	requestId: string,
	command: string,
	success: boolean,
	sessionId?: string,
	error?: string,
): void {
	const message: CSToPopupMessage = {
		direction: "cs→popup",
		type: "recording-response",
		requestId,
		command: command as "start" | "pause" | "resume" | "stop",
		success,
		sessionId,
		error,
	};

	chrome.runtime.sendMessage(message).catch((e) => {
		logger.cs.debug("推送命令响应到 Popup 失败:", e);
	});

	logger.cs.info("已发送响应到 Popup:", {
		requestId,
		command,
		success,
		sessionId,
	});
}

// ==================== 命令处理 ====================

/**
 * 处理来自 Popup 的命令
 */
async function handleCommand(message: PopupToCSMessage): Promise<void> {
	const { requestId, command } = message;
	logger.cs.info(`处理命令: ${command}, requestId: ${requestId}`);

	try {
		switch (command) {
			case "start": {
				const result = (await sendToRRWeb("start")) as {
					success: boolean;
					sessionId?: string;
					error?: string;
				};

				logger.cs.info("start 命令响应:", result);

				if (result.success && result.sessionId) {
					// 开始成功
					logger.cs.info("start 成功，更新状态");
					notifyStateChange({
						isRecording: true,
						isPaused: false,
						sessionId: result.sessionId,
						startTime: Date.now(),
						duration: 0,
					});
					startUpdateTimer();
					pushCommandResponseToPopup(
						requestId,
						command,
						true,
						result.sessionId,
					);
				} else if (result.error === "Already recording") {
					// 已经在录制，尝试获取当前状态并同步
					logger.cs.info("已经在录制，同步状态");
					const stateResult = (await sendToRRWeb("status")) as {
						success: boolean;
						isRecording?: boolean;
						isPaused?: boolean;
						sessionId?: string;
					};
					if (stateResult.success && stateResult.isRecording) {
						notifyStateChange({
							isRecording: true,
							isPaused: stateResult.isPaused ?? false,
							sessionId: stateResult.sessionId,
						});
						if (!stateResult.isPaused) {
							startUpdateTimer();
						}
					}
					pushCommandResponseToPopup(
						requestId,
						command,
						true,
						stateResult.sessionId,
					);
				} else {
					logger.cs.warn("start 失败:", result.error);
					pushCommandResponseToPopup(
						requestId,
						command,
						false,
						undefined,
						result.error,
					);
				}
				break;
			}

			case "pause": {
				await sendToRRWeb("pause");
				notifyStateChange({ isPaused: true });
				pushCommandResponseToPopup(requestId, command, true);
				break;
			}

			case "resume": {
				await sendToRRWeb("resume");
				notifyStateChange({ isPaused: false });
				pushCommandResponseToPopup(requestId, command, true);
				break;
			}

			case "stop": {
				await sendToRRWeb("stop");
				stopUpdateTimer();
				notifyStateChange({
					isRecording: false,
					isPaused: false,
					sessionId: undefined,
					startTime: undefined,
					duration: 0,
				});
				pushCommandResponseToPopup(requestId, command, true);
				break;
			}

			default:
				logger.cs.warn(`未知命令: ${command}`);
				pushCommandResponseToPopup(
					requestId,
					command,
					false,
					undefined,
					`Unknown command: ${command}`,
				);
		}
	} catch (e) {
		logger.cs.error(`命令执行失败: ${command}`, e);
		pushCommandResponseToPopup(requestId, command, false, undefined, String(e));
	}
}

// ==================== SW 消息监听 ====================

/**
 * 监听来自 SW 路由的消息
 */
function setupSWMessageListener(): void {
	chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
		// 只处理来自 SW 的录制命令
		if (message?.direction === "popup→sw→cs") {
			logger.cs.info("收到 SW 路由的命令:", message);
			handleCommand(message as PopupToCSMessage);
			sendResponse({ success: true });
			return true;
		}

		// 不处理其他消息
		return false;
	});
}

// ==================== 公开 API ====================

/**
 * 初始化 CS 通信层
 * 应该在 CS 加载时调用一次
 */
export function initCSCommunicator(): void {
	if (isInitialized) {
		logger.cs.debug("CSCommunicator 已初始化，跳过");
		return;
	}

	logger.cs.info("初始化 CSCommunicator");

	// 设置 rrweb 监听器
	setupRRWebListener();

	// 设置 SW 消息监听
	setupSWMessageListener();

	isInitialized = true;
	logger.cs.info("CSCommunicator 初始化完成");
}

/**
 * 获取当前状态
 */
export function getCSState(): RecordingState {
	return { ...currentState };
}

/**
 * 添加状态监听器
 * @param listener 状态变化回调
 * @returns 取消监听函数
 */
export function addStateListener(listener: StateListener): () => void {
	stateListeners.add(listener);
	logger.cs.debug("添加状态监听器, 当前数量:", stateListeners.size);

	return () => {
		stateListeners.delete(listener);
		logger.cs.debug("移除状态监听器, 当前数量:", stateListeners.size);
	};
}

/**
 * 添加命令响应监听器
 * @param requestId 请求 ID
 * @param listener 响应回调
 * @returns 取消监听函数
 */
export function addResponseListener(
	requestId: string,
	listener: ResponseListener,
): () => void {
	const wrappedListener = (response: Parameters<ResponseListener>[0]) => {
		responseListeners.delete(requestId);
		listener(response);
	};

	responseListeners.set(requestId, wrappedListener);

	// 5 秒后自动清理
	setTimeout(() => {
		if (responseListeners.has(requestId)) {
			responseListeners.delete(requestId);
			logger.cs.debug(`响应监听器超时清理: ${requestId}`);
		}
	}, 5000);

	return () => {
		responseListeners.delete(requestId);
	};
}
