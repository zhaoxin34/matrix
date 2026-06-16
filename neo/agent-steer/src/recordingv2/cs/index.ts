/**
 * Recording v2 CS - 入口
 *
 * 在 content script 的 main() 中调用。
 *
 * 3c 范围：
 *   - 启动时检测 storage, 如果有活跃 recording 自动接管（重启续传）
 *   - 注册 4 个 trigger
 */

import { setupMessageListener } from "./messages";
import {
	setupFlushTimer,
	setupVisibilityChange,
	setupChromeIdle,
	tryResumeRecording,
} from "./triggers";
import { logger } from "@/common/logger";

let initialized = false;

export async function initCSRecorderV2(): Promise<void> {
	if (initialized) {
		logger.cs.debug("v2 CS 已初始化，跳过");
		return;
	}
	initialized = true;
	logger.cs.info("init v2 CS recorder");

	setupMessageListener();
	setupFlushTimer();
	setupVisibilityChange();
	setupChromeIdle();

	// 重启续传：检测 storage 中是否有活跃 recording
	// 注意: 这必须在 listener 注册后调用, 避免 pushStateToPopup 漏推送
	await tryResumeRecording();
}
