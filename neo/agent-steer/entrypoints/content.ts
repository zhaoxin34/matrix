/**
 * Content Script Entry Point
 *
 * 职责：
 * - 调用 @/recording 模块初始化录制功能
 *
 * 使用 @/recording 导出的 API，无需关心内部实现
 */

import { initCSRecorder } from "../src/recording";

console.log("[content] Content Script 加载中...");

// WXT Content Script 入口
export default defineContentScript({
	matches: ["<all_urls>"],
	runAt: "document_start",
	async main() {
		console.log("[content] main() 开始执行");
		try {
			await initCSRecorder();
			console.log("[content] initCSRecorder() 完成");
		} catch (e) {
			console.error("[content] initCSRecorder() 失败:", e);
		}
	},
});
