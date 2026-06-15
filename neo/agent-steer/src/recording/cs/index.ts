/**
 * CS Communicator 入口
 *
 * 职责：
 * 1. 初始化 CS 通信层
 * 2. 导出录制状态和命令接口
 */

import { setupRRWebListener } from "./rrweb";
import { setupSWMessageListener } from "./listener";
import { addStateListener, getCurrentState } from "./state";
import { logger } from "@/common/logger";

/** 是否已初始化 */
let isInitialized = false;

/**
 * 初始化 CS 通信层
 */
export function initCSCommunicator(): void {
	if (isInitialized) {
		logger.cs.debug("CSCommunicator 已初始化，跳过");
		return;
	}

	logger.cs.info("初始化 CSCommunicator");

	// 设置 rrweb 监听器
	setupRRWebListener();

	// 设置 SW 消息监听
	setupSWMessageListener();

	isInitialized = true;
	logger.cs.info("CSCommunicator 初始化完成");
}

/**
 * 初始化录制模块（initCSCommunicator 的别名，保持向后兼容）
 */
export const initRecorder = initCSCommunicator;

/**
 * 清理录制模块
 */
export function cleanup(): void {
	logger.cs.info("CSCommunicator: 清理");
	isInitialized = false;
}

/**
 * 获取当前状态（别名，保持向后兼容）
 */
export const getCSState = getCurrentState;

// 导出类型
export type { StateListener, ResponseListener } from "./types";

// 导出 API
export { getCurrentState, addStateListener };
