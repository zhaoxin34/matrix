/**
 * Content Script Entry Point
 *
 * v2: SW 注 rrweb UMD 到 ISOLATED world, CS 直接调 window.rrwebRecord.record()
 */

import { initCSRecorderV2 } from "../src/recordingv2/cs";
import { logger } from "@/common/logger";

export default defineContentScript({
	matches: ["<all_urls>"],
	runAt: "document_start",
	async main() {
		logger.cs.info("v2 main() 开始执行");
		try {
			await initCSRecorderV2();
			logger.cs.info("initCSRecorderV2() 完成");
		} catch (e) {
			logger.cs.error("initCSRecorderV2() 失败:", e);
		}
	},
});
