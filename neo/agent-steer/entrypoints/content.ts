/**
 * Content script (isolated world) — 极薄桥。
 *
 * 1. 监听 page main world 的 rrweb-bridge postMessage 事件
 * 2. 转发到 background
 *
 * 自身不打包 rrweb——rrweb 在 rrweb-bridge.js (unlisted) 里。
 */
export default defineContentScript({
	matches: ["<all_urls>"],
	runAt: "document_start",
	main() {
		window.addEventListener("message", (event: MessageEvent) => {
			if (event.source !== window) return;
			const data = event.data;
			if (
				!data ||
				data.source !== "rrweb-bridge" ||
				data.type !== "rrweb-event"
			)
				return;
			try {
				browser.runtime.sendMessage({
					type: "rrweb-event",
					payload: data.payload,
				});
			} catch {
				// background 还没准备好时 (e.g. service worker 启动延迟) 静默忽略
			}
		});
	},
});
