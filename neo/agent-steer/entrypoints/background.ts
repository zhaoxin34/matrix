/**
 * Background service worker.
 *
 * Plan B 架构:
 * - rrweb-bridge.js 是 unlisted script (不在 content_scripts manifest)
 * - 这里用 webNavigation.onCommitted 触发 executeScript({world:'MAIN'})
 * - 在 page main world 跑 rrweb.record()
 * - 事件经 window.postMessage → content script → 这里
 */
export default defineBackground(() => {
	console.log("[background] hello", { id: browser.runtime.id });

	// 注入 rrweb 到 page main world。
	// 用 webNavigation 而不是 tabs.onUpdated,因为:
	// 1) onCommitted 比 onUpdated 早,能赶上 document_start
	// 2) 只对主 frame 触发 (frameId === 0)
	browser.webNavigation.onCommitted.addListener(async (details) => {
		if (details.frameId !== 0) return;
		console.log(
			"[background] nav committed:",
			details.url,
			"tab",
			details.tabId,
		);
		try {
			const result = await browser.scripting.executeScript({
				target: { tabId: details.tabId },
				world: "MAIN",
				injectImmediately: true,
				files: ["rrweb-bridge.js"],
			});
			console.log("[background] inject result:", JSON.stringify(result));
		} catch (e) {
			console.log("[background] inject failed:", String(e));
		}
	});

	// 接收 content script 转发的 rrweb 事件
	browser.runtime.onMessage.addListener(
		(message: { type: string; payload?: unknown }, _sender: unknown) => {
			if (message?.type === "rrweb-event") {
				const ev = message.payload as
					| { type?: number; timestamp?: number }
					| undefined;
				if (ev?.type === 4) return; // Meta 事件少打
				console.log(
					"[background] rrweb event type=" + ev?.type + " t=" + ev?.timestamp,
				);
			}
		},
	);
});
