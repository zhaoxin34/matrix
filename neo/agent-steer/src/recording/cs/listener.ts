/**
 * CS SW 消息监听
 */

import type { PopupToCSMessage } from "../types";
import { handleCommand } from "./commands";
import { logger } from "@/common/logger";

/**
 * 监听来自 SW 路由的消息
 */
export function setupSWMessageListener(): void {
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
