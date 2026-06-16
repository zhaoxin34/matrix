/**
 * Recording v2 CS - 消息处理
 *
 * 3a 范围：
 *   - 监听 chrome.runtime.onMessage
 *   - 接收 start / pause / resume / stop 命令
 *   - 通过 pushStateToPopup 推送状态变更
 *
 * 不做：
 *   - 复杂消息信封（v1 的 direction/requestId 全部去掉）
 *   - SW 路由（v2 popup 直连 CS）
 */

import { logger } from "@/common/logger";
import { getState } from "./state";
import { handleStart, handlePause, handleResume, handleStop } from "./commands";

export const MESSAGE_TYPES = {
	START: "recording.start",
	PAUSE: "recording.pause",
	RESUME: "recording.resume",
	STOP: "recording.stop",
	STATE_UPDATE: "recording.state-update",
} as const;

export function setupMessageListener(): void {
	chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
		if (!message || typeof message !== "object") return false;
		const { type } = message as { type?: string };
		if (!type) return false;

		logger.cs.debug("recv", type);

		if (type === MESSAGE_TYPES.START) {
			handleStart()
				.then(() => sendResponse({ success: true }))
				.catch((e) => sendResponse({ success: false, error: String(e) }));
			return true;
		}
		if (type === MESSAGE_TYPES.PAUSE) {
			handlePause()
				.then(() => sendResponse({ success: true }))
				.catch((e) => sendResponse({ success: false, error: String(e) }));
			return true;
		}
		if (type === MESSAGE_TYPES.RESUME) {
			handleResume()
				.then(() => sendResponse({ success: true }))
				.catch((e) => sendResponse({ success: false, error: String(e) }));
			return true;
		}
		if (type === MESSAGE_TYPES.STOP) {
			handleStop()
				.then(() => sendResponse({ success: true }))
				.catch((e) => sendResponse({ success: false, error: String(e) }));
			return true;
		}

		return false;
	});
	logger.cs.info("message listener registered");
}

/**
 * 推送状态到 popup
 * 失败时静默（popup 没开时 sendMessage 会 reject）
 */
export function pushStateToPopup(): void {
	const s = getState();
	chrome.runtime
		.sendMessage({
			type: MESSAGE_TYPES.STATE_UPDATE,
			state: {
				status: s.status,
				recordingUid: s.recordingUid,
				currentSegmentUid: s.currentSegmentUid,
				recordingStartedAt: s.recordingStartedAt,
				totalPausedMs: s.totalPausedMs,
				pausedAt: s.pausedAt,
				segmentCount: s.segmentCount,
			},
		})
		.catch(() => {
			// popup 未打开时静默
		});
}
