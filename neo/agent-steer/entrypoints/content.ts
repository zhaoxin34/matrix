/**
 * Content Script Entry Point
 *
 * 对应设计文档: design/docs/technical/agent-steer/recording.md
 *
 * Handles communication with rrweb-bridge.js and manages recording state.
 */

import {
	initRecorder,
	cleanupRecorder,
	createCSMessageHandler,
} from "../src/recording";

export default defineContentScript({
	matches: ["<all_urls>"],
	runAt: "document_start",
	async main() {
		console.log("[content] Initializing content script...");

		// 初始化录制模块
		try {
			await initRecorder();
		} catch (error) {
			console.error("[content] Failed to initialize recorder:", error);
		}

		// 注册消息监听器
		const messageHandler = createCSMessageHandler();
		browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
			messageHandler(message)
				.then((response) => {
					sendResponse(response);
				})
				.catch((error) => {
					sendResponse({ success: false, error: String(error) });
				});
			return true; // 异步响应
		});

		// 清理
		self.addEventListener("unload", () => {
			cleanupRecorder();
		});
	},
});
