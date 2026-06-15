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
		// 处理来自 SW 的录制命令（两种格式都支持）
		if (
			message?.direction === "popup→sw→cs" ||
			message?.direction === "sw→cs"
		) {
			logger.cs.info("收到 SW 路由的命令:", message);

			// 如果是 reset 命令（sw→cs 格式），转换为 PopupToCSMessage 格式
			if (message?.direction === "sw→cs" && message?.type === "reset") {
				const resetMessage: PopupToCSMessage = {
					direction: "popup→sw→cs",
					type: "recording-cmd",
					requestId: `reset-${Date.now()}`,
					command: "reset",
				};
				handleCommand(resetMessage);
			} else {
				handleCommand(message as PopupToCSMessage);
			}

			sendResponse({ success: true });
			return true;
		}

		// 不处理其他消息
		return false;
	});
}
