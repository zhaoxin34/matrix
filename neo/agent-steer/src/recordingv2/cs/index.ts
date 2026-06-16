/**
 * Recording v2 CS - 入口
 *
 * 在 content script 的 main() 中调用。
 *
 * 3a 范围：注册消息监听。
 * 3c 范围：注册 trigger（10 分钟定时 / 切 tab / 不活跃 / rrweb 启动）。
 */

import { setupMessageListener } from "./messages";
import { logger } from "@/common/logger";

let initialized = false;

export function initCSRecorderV2(): void {
	if (initialized) {
		logger.cs.debug("v2 CS 已初始化，跳过");
		return;
	}
	initialized = true;
	logger.cs.info("init v2 CS recorder");
	setupMessageListener();
}
