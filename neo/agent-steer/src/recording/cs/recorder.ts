/**
 * Content Script Recorder Module
 *
 * 职责：
 * 1. 初始化 CS 通信层
 * 2. 导出录制状态和命令接口
 *
 * 注意：实际的录制逻辑在 communicator.ts 中实现
 */

import { logger } from "@/common/logger";
import {
	initCSCommunicator,
	getCSState,
	addStateListener,
} from "./communicator";

// ==================== 导出 ====================

export { getCSState, addStateListener };

// ==================== 初始化 ====================

let isInitialized = false;

/**
 * 初始化录制模块
 * 初始化 CS 通信层，设置与 rrweb 和 Popup 的通信
 */
export async function initRecorder(): Promise<void> {
	if (isInitialized) {
		logger.cs.debug("recorder: 已初始化，跳过");
		return;
	}

	logger.cs.info("recorder: 开始初始化");

	// 初始化通信层
	initCSCommunicator();

	isInitialized = true;
	logger.cs.info("recorder: 初始化完成");
}

/**
 * 清理录制模块
 */
export function cleanup(): void {
	logger.cs.info("recorder: 清理");
	isInitialized = false;
}

// 导出 communicator 的其他功能
export { addResponseListener } from "./communicator";
