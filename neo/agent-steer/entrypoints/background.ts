/**
 * Background service worker.
 *
 * Handles:
 * - Injecting rrweb-bridge.js into page main world
 * - Service Worker upload to Neo Backend API
 * - Message handling for Popup communication
 */

import {
	createSWMessageHandler,
	initUploader,
	cleanupUploader,
} from "../src/recording";

export default defineBackground(() => {
	console.log("[background] hello", { id: browser.runtime.id });

	// 初始化上传模块
	initUploader().catch(console.error);

	// 注入 rrweb 和 rrweb-bridge.js 到新打开的页面
	browser.webNavigation?.onCommitted?.addListener(async (details) => {
		// 只注入主框架
		if (details.frameId !== 0) return;
		// 忽略扩展页面
		if (
			details.url.startsWith("chrome://") ||
			details.url.startsWith("moz-extension://")
		)
			return;

		console.log("[background] Injecting scripts into:", details.url);

		try {
			// 先注入 rrweb 库
			await browser.scripting.executeScript({
				target: { tabId: details.tabId },
				files: ["/rrweb.js"],
				world: "MAIN",
			});
			console.log("[background] rrweb.js injected");

			// 再注入 rrweb-bridge.js
			await browser.scripting.executeScript({
				target: { tabId: details.tabId },
				files: ["/rrweb-bridge.js"],
				world: "MAIN",
			});
			console.log("[background] rrweb-bridge.js injected");
		} catch (error) {
			console.error("[background] Failed to inject scripts:", error);
		}
	});

	// 使用统一的 SW 消息处理器
	const messageHandler = createSWMessageHandler();

	browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
		console.log("[background] Received message:", message.type);

		messageHandler(message)
			.then((response) => {
				sendResponse(response);
			})
			.catch((error) => {
				console.error("[background] Message handler error:", error);
				sendResponse({ success: false, error: String(error) });
			});

		// 返回 true 表示异步响应
		return true;
	});

	// 清理
	self.addEventListener("unload", () => {
		cleanupUploader();
	});
});
