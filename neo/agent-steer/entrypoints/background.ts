/**
 * Background Service Worker
 *
 * v2: SW 负责把 rrweb UMD 注入到 ISOLATED world（content script 的 JS context）。
 * CS 通过轮询等待 UMD 注好，然后直接调 window.rrwebRecord.record()。
 */

import { logger } from "@/common/logger";

export default defineBackground(() => {
	logger.sw.info("v2 hello");

	/**
	 * 把 rrweb UMD 注入到指定 tab 的 ISOLATED world
	 */
	async function injectRRWeb(tabId: number) {
		if (!browser.scripting) {
			logger.sw.error("browser.scripting 不可用");
			return;
		}
		try {
			await browser.scripting.executeScript({
				target: { tabId },
				files: ["/rrweb-record.umd.min.js"],
				world: "ISOLATED" as "ISOLATED",
			});
			logger.sw.info("rrweb UMD 注入成功, tabId:", tabId);
		} catch (e) {
			logger.sw.error("rrweb UMD 注入失败:", e);
		}
	}

	// 新网页就绪时注入
	browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
		if (
			changeInfo.status === "complete" &&
			tab.url &&
			!tab.url.startsWith("chrome://") &&
			!tab.url.startsWith("about:") &&
			!tab.url.startsWith("moz-")
		) {
			injectRRWeb(tabId);
		}
	});

	// 已有真实网页也注入
	browser.tabs
		.query({ status: "complete", windowId: browser.windows.WINDOW_ID_CURRENT })
		.then((tabs) => {
			const realTab = tabs.find(
				(t) =>
					t.url &&
					!t.url.startsWith("chrome://") &&
					!t.url.startsWith("about:") &&
					!t.url.startsWith("moz-"),
			);
			if (realTab?.id) {
				injectRRWeb(realTab.id);
			}
		});
});
