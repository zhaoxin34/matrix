/**
 * CS Communicator 入口
 *
 * 职责：
 * 1. 初始化 CS 通信层
 * 2. 启动时检查 IndexedDB 中是否有未上传的 segments，恢复 Pending 状态
 * 3. 导出录制状态和命令接口
 */

import { setupRRWebListener } from "./rrweb";
import { setupSWMessageListener } from "./listener";
import { addStateListener, getCurrentState, notifyStateChange } from "./state";
import { logger } from "@/common/logger";
import { getUnsyncedSegments } from "../db/indexeddb";

/** 是否已初始化 */
let isInitialized = false;

/**
 * 启动时检测 IndexedDB 中是否有未上传的 segments，如有则推送 pending 状态
 * 场景: 浏览器重启后，用户重新打开扩展时恢复 Pending 视图
 */
async function detectPendingOnStartup(): Promise<void> {
	try {
		const segments = await getUnsyncedSegments();
		if (segments.length > 0) {
			logger.cs.info(
				`CS 启动检测: 发现 ${segments.length} 个未上传 segments,推送 pending 状态`,
			);
			const sessionId = segments[0]?.sessionId;
			notifyStateChange({
				status: "pending",
				sessionId,
				segmentCount: segments.length,
				eventCount: segments.reduce((sum, s) => sum + (s.eventCount ?? 0), 0),
			});
		}
	} catch (e) {
		logger.cs.warn("CS 启动检测 IndexedDB 失败", e);
	}
}

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

	// 启动时检测是否有未上传 segments（浏览器重启场景）
	void detectPendingOnStartup();

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
