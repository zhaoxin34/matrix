/**
 * Service Worker 通信层
 *
 * 职责：
 * 1. 接收 Popup 的录制命令
 * 2. 路由到指定 Tab 的 CS
 * 3. 处理上传命令
 * 4. CS 状态推送的路由（CS → Popup）
 */

import { logger } from "@/common/logger";
import { STORAGE_KEYS } from "../storage";
import { storage } from "#imports";
import type { UploadCmd, UploadProgress } from "../types";
import type { PopupToCSMessage } from "../types";
import { cancelUploadAction, clearAllRecordingData } from "./uploader";

// ==================== 常量 ====================

/** 消息方向标识 */
const DIRECTIVE_POPUP_TO_CS = "popup→sw→cs";

// ==================== Recorder 注入 ====================

/** 注入状态 */
let isRecorderInitialized = false;

/**
 * 注入 rrweb UMD 和 recorder.js 到指定 tab
 */
async function injectRecorder(tabId: number): Promise<boolean> {
	logger.sw.info("injectRecorder: 开始注入到 tab", tabId);
	try {
		// 先注入 rrweb UMD
		await browser.scripting.executeScript({
			target: { tabId },
			files: ["/rrweb-record.umd.min.js"],
			world: "MAIN",
		});
		logger.sw.debug("injectRecorder: rrweb 注入成功");

		// 再注入 recorder 脚本
		// 使用类型断言绕过 WXT 的严格类型检查
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (browser.scripting as any).executeScript({
			target: { tabId },
			files: ["/recorder.js"],
			world: "MAIN",
		});
		logger.sw.info("injectRecorder: recorder.js 注入成功");
		return true;
	} catch (error) {
		logger.sw.error("injectRecorder: 注入失败", error);
		return false;
	}
}

/**
 * 初始化录制模块 - 注入 rrweb 到新打开的页面
 */
function initRecorderInjection(): void {
	if (isRecorderInitialized) {
		return;
	}

	logger.sw.info("initRecorderInjection: 开始初始化注入监听");

	// 注入 rrweb UMD 构建到新打开的页面
	browser.webNavigation?.onCommitted?.addListener(async (details) => {
		// 只注入主框架
		if (details.frameId !== 0) return;
		// 忽略扩展页面
		if (
			details.url.startsWith("chrome://") ||
			details.url.startsWith("moz-extension://") ||
			details.url.startsWith("about:blank") ||
			details.url.startsWith("devtools://")
		)
			return;

		logger.sw.debug("导航事件，注入 rrweb 到 tab", details.tabId);
		injectRecorder(details.tabId);
	});

	isRecorderInitialized = true;
	logger.sw.info("initRecorderInjection: 初始化完成");
}

// ==================== 类型定义 ====================

/** 上传状态 */
interface UploadState {
	isUploading: boolean;
	progress: UploadProgress | null;
}

// ==================== 状态 ====================

/** 当前上传状态 */
const uploadState: UploadState = {
	isUploading: false,
	progress: null,
};

// ==================== 工具函数 ====================

/**
 * 生成唯一请求 ID
 */
function generateRequestId(): string {
	return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 获取当前活动的 Tab ID
 */
async function getCurrentTabId(): Promise<number | null> {
	try {
		const tabs = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		return tabs[0]?.id ?? null;
	} catch (e) {
		logger.sw.error("获取当前 Tab 失败:", e);
		return null;
	}
}

// ==================== 录制命令处理 ====================

/**
 * 发送录制命令到 Content Script
 */
async function sendRecordingCommandToCS(
	tabId: number,
	command: "start" | "pause" | "resume" | "stop",
	requestId: string,
): Promise<{ success: boolean; error?: string }> {
	logger.sw.info(`发送录制命令到 CS: ${command}, tabId: ${tabId}`);

	try {
		// 构建消息
		const message: PopupToCSMessage = {
			direction: DIRECTIVE_POPUP_TO_CS,
			type: "recording-cmd",
			requestId,
			command,
		};

		// 发送到 CS
		const response = await browser.tabs.sendMessage(tabId, message);

		if (response?.success) {
			logger.sw.info(`录制命令发送成功: ${command}`);
			return { success: true };
		} else {
			logger.sw.error(`录制命令发送失败: ${command}`, response?.error);
			return { success: false, error: response?.error };
		}
	} catch (e) {
		logger.sw.error(`发送录制命令到 CS 失败: ${command}`, e);
		return {
			success: false,
			error: e instanceof Error ? e.message : String(e),
		};
	}
}

// ==================== 公开 API - 录制 ====================

/**
 * 开始录制
 */
export async function startRecording(): Promise<{
	success: boolean;
	requestId?: string;
	error?: string;
}> {
	const tabId = await getCurrentTabId();
	if (!tabId) {
		return { success: false, error: "No active tab" };
	}

	const requestId = generateRequestId();
	const result = await sendRecordingCommandToCS(tabId, "start", requestId);

	return {
		success: result.success,
		requestId: result.success ? requestId : undefined,
		error: result.error,
	};
}

/**
 * 暂停录制
 */
export async function pauseRecording(): Promise<{
	success: boolean;
	requestId?: string;
	error?: string;
}> {
	const tabId = await getCurrentTabId();
	if (!tabId) {
		return { success: false, error: "No active tab" };
	}

	const requestId = generateRequestId();
	const result = await sendRecordingCommandToCS(tabId, "pause", requestId);

	return {
		success: result.success,
		requestId: result.success ? requestId : undefined,
		error: result.error,
	};
}

/**
 * 恢复录制
 */
export async function resumeRecording(): Promise<{
	success: boolean;
	requestId?: string;
	error?: string;
}> {
	const tabId = await getCurrentTabId();
	if (!tabId) {
		return { success: false, error: "No active tab" };
	}

	const requestId = generateRequestId();
	const result = await sendRecordingCommandToCS(tabId, "resume", requestId);

	return {
		success: result.success,
		requestId: result.success ? requestId : undefined,
		error: result.error,
	};
}

/**
 * 停止录制
 */
export async function stopRecording(): Promise<{
	success: boolean;
	requestId?: string;
	error?: string;
}> {
	const tabId = await getCurrentTabId();
	if (!tabId) {
		return { success: false, error: "No active tab" };
	}

	const requestId = generateRequestId();
	const result = await sendRecordingCommandToCS(tabId, "stop", requestId);

	return {
		success: result.success,
		requestId: result.success ? requestId : undefined,
		error: result.error,
	};
}

/**
 * 获取当前录制状态
 */
export async function getRecordingState(): Promise<{
	status: "idle" | "recording" | "paused" | "pending" | "uploading" | "success" | "error";
	duration: number;
	segmentCount: number;
	eventCount: number;
}> {
	const defaultState = {
		status: "idle" as const,
		duration: 0,
		segmentCount: 0,
		eventCount: 0,
	};

	try {
		const state = await storage.getItem<typeof defaultState>(
			STORAGE_KEYS.RECORDING_STATE,
		);
		if (state && typeof state.status === "string") {
			return state;
		}
		return defaultState;
	} catch {
		return defaultState;
	}
}

// ==================== 公开 API - 上传 ====================

/**
 * 开始上传
 */
export async function startUpload(
	name: string,
	workspaceCode: string,
): Promise<{ success: boolean; error?: string }> {
	logger.sw.info(`开始上传: ${name}, workspace: ${workspaceCode}`);

	const cmd: UploadCmd = {
		name,
		workspaceCode,
	};

	try {
		// 保存上传命令到 storage
		await storage.setItem(STORAGE_KEYS.UPLOAD_CMD, cmd);

		// 更新上传状态
		uploadState.isUploading = true;
		uploadState.progress = {
			taskId: `upload_${Date.now()}`,
			status: "uploading",
			progress: 0,
		};

		// TODO: 实际的上传逻辑应该由 uploader 模块处理
		// 这里只是设置命令，实际上传由 uploader.ts 的轮询处理

		return { success: true };
	} catch (e) {
		logger.sw.error("设置上传命令失败:", e);
		return {
			success: false,
			error: e instanceof Error ? e.message : String(e),
		};
	}
}

/**
 * 获取上传进度
 */
export function getUploadProgress(): UploadProgress | null {
	return uploadState.progress;
}

/**
 * 取消上传
 */
export async function cancelUpload(): Promise<{
	success: boolean;
	error?: string;
}> {
	logger.sw.info("取消上传");

	try {
		// 调用 uploader 的取消函数
		await cancelUploadAction();

		// 重置 SW 通信层的上传状态
		uploadState.isUploading = false;
		uploadState.progress = null;

		return { success: true };
	} catch (e) {
		logger.sw.error("取消上传失败:", e);
		return {
			success: false,
			error: e instanceof Error ? e.message : String(e),
		};
	}
}

/**
 * 清除所有录制数据（segments、sessions）并重置状态
 */
export async function clearRecording(): Promise<{
	success: boolean;
	error?: string;
}> {
	logger.sw.info("清除录制数据");

	try {
		// 1. 清除所有录制数据
		await clearAllRecordingData();

		// 2. 重置录制状态到 storage
		const defaultState = {
			status: "idle" as const,
			duration: 0,
			segmentCount: 0,
			eventCount: 0,
		};
		await storage.setItem(STORAGE_KEYS.RECORDING_STATE, defaultState);

		// 3. 通知所有标签页重置状态
		const tabs = await browser.tabs.query({});
		for (const tab of tabs) {
			if (tab.id && tab.url?.startsWith("http")) {
				try {
					await browser.tabs.sendMessage(tab.id, {
						direction: "sw→cs",
						type: "reset",
					});
				} catch {
					// 忽略无法发送消息的标签页
				}
			}
		}

		logger.sw.info("录制数据清除成功");
		return { success: true };
	} catch (e) {
		logger.sw.error("清除录制数据失败:", e);
		return {
			success: false,
			error: e instanceof Error ? e.message : String(e),
		};
	}
}

// ==================== 公开 API - 初始化 ====================

/**
 * 初始化 SW 通信层
 */
export function initSWCommunicator(): void {
	logger.sw.info("初始化 SWCommunicator");

	// 初始化录制注入监听
	initRecorderInjection();

	// CS 状态推送的路由处理
	// CS 通过 chrome.runtime.sendMessage 发送状态，SW 接收后不做处理
	// 因为 CS 和 Popup 都在同一扩展上下文中，可以直接通信
	// 这个监听器主要用于调试和日志

	browser.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
		// 记录 CS 发来的消息
		if (message?.direction === "cs→popup") {
			logger.sw.debug("收到 CS 状态推送:", message);
			// 不拦截，让消息直接到达 Popup
		}
		return false;
	});

	logger.sw.info("SWCommunicator 初始化完成");
}
