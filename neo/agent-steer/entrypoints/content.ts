/**
 * Content Script Entry Point
 *
 * v2 阶段 3a：切到 v2 CS recorder。
 * v1 CS recorder 不再被启动（v1 路径仍保留代码, 阶段 5 清理）。
 */

import { initCSRecorderV2 } from "../src/recordingv2/cs";

console.log("[content] v2 Content Script 加载中...");

export default defineContentScript({
	matches: ["<all_urls>"],
	runAt: "document_start",
	async main() {
		console.log("[content] v2 main() 开始执行");
		try {
			await initCSRecorderV2();
			console.log("[content] initCSRecorderV2() 完成");
		} catch (e) {
			console.error("[content] initCSRecorderV2() 失败:", e);
		}
	},
});
