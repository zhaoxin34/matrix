/**
 * Service Worker Recording Handler Module
 *
 * 职责：
 * 1. 注入 rrweb 到页面
 * 2. 处理 injectRecorder 请求
 * 3. 初始化录制模块
 * 4. 处理所有 SW 消息
 */

import { storage } from "#imports";
import { logger } from "@/common/logger";
import { STORAGE_KEYS, MESSAGE_TYPES } from "../messages";
import { getAuthToken, saveConfig, getConfig } from "@/common/storage";
import { getUploadProgress } from "../messages";
import type { RecordingMessage, RecordingMessageResponse } from "../types";

// ==================== Recorder Injection ====================

/**
 * 注入 rrweb UMD 和 recorder.js 到指定 tab
 */
export async function injectRecorder(tabId: number): Promise<boolean> {
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

// ==================== Recorder Initialization ====================

let isRecorderInitialized = false;

/**
 * 初始化录制模块
 * - 注入 rrweb UMD 构建到新打开的页面
 * - 处理 injectRecorder 请求
 */
export function initRecorder(): void {
	if (isRecorderInitialized) {
		return;
	}

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

		// 异步注入
		injectRecorder(details.tabId);
	});

	// 处理 content script 的注入请求
	browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
		logger.sw.info("SW: 收到消息", {
			type: message.type,
			payload: message.payload,
			sender: sender.tab?.id,
		});

		if (message?.type === "injectRecorder" && sender.tab?.id) {
			logger.sw.info("SW: 处理 injectRecorder 请求, tabId:", sender.tab.id);
			injectRecorder(sender.tab.id).then((success) => {
				logger.sw.info("SW: injectRecorder 完成, success:", success);
				sendResponse({ success });
			});
			return true;
		}

		return false; // 其他消息由 createSWMessageHandler 处理
	});

	isRecorderInitialized = true;
	console.log("[sw-handler] Recorder module initialized");
}

// ==================== Service Worker Message Handler ====================

/**
 * 获取录制状态
 */
async function getRecordingState() {
	try {
		return await storage.getItem(STORAGE_KEYS.RECORDING_STATE);
	} catch {
		return null;
	}
}

/**
 * 创建 Service Worker 消息处理函数
 * 处理所有来自 popup 的消息
 */
export function createSWMessageHandler() {
	return async (
		message: RecordingMessage,
	): Promise<RecordingMessageResponse> => {
		logger.sw.info("createSWMessageHandler: 收到消息", message.type);

		try {
			switch (message.type) {
				case MESSAGE_TYPES.RECORDING_GET_STATE: {
					const state = await getRecordingState();
					return { success: true, data: state };
				}

				case MESSAGE_TYPES.RECORDING_SET_CMD: {
					const cmd = message.payload;
					logger.sw.info("createSWMessageHandler: 设置录制命令", cmd);
					await storage.setItem(STORAGE_KEYS.RECORDING_CMD, cmd);
					return { success: true };
				}

				case MESSAGE_TYPES.RECORDING_GET_UPLOAD_PROGRESS: {
					const progress = await getUploadProgress();
					return { success: true, data: progress };
				}

				case MESSAGE_TYPES.RECORDING_SET_UPLOAD_CMD: {
					const cmd = message.payload;
					await storage.setItem(STORAGE_KEYS.UPLOAD_CMD, cmd);
					return { success: true };
				}

				case MESSAGE_TYPES.RECORDING_CANCEL_UPLOAD: {
					await storage.setItem(STORAGE_KEYS.UPLOAD_CMD, { action: "cancel" });
					return { success: true };
				}

				case MESSAGE_TYPES.RECORDING_SAVE_CONFIG: {
					const config = message.payload as Parameters<typeof saveConfig>[0];
					await saveConfig(config);
					return { success: true };
				}

				case MESSAGE_TYPES.RECORDING_GET_AUTH_TOKEN: {
					const token = await getAuthToken();
					return { success: true, data: token };
				}

				case MESSAGE_TYPES.RECORDING_OPEN_NEO: {
					const { url } = (message.payload as { url?: string }) || {};
					const config = await getConfig();
					const openUrl = url || config.neoUrl;
					browser.tabs.create({ url: openUrl });
					return { success: true };
				}

				default:
					return {
						success: false,
						error: `Unknown message type: ${message.type}`,
					};
			}
		} catch (error) {
			return { success: false, error: String(error) };
		}
	};
}
