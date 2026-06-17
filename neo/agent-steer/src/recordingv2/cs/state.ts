/**
 * Recording v2 CS - 状态机
 *
 * 3a 范围：内存状态（不存 chrome.storage，重启续传留给阶段 4）。
 *
 * duration 由 UI 端基于 startTime / totalPausedMs / pausedAt 自己用 setInterval
 * 计算（不在 CS 端每秒推）。
 *
 * 字段：
 *   status               - 3 状态 (idle / recording / paused)
 *   recordingUid         - 后端 recording 身份（start 时拿）
 *   currentSegmentUid    - 当前 segment 身份（每次切 segment 时更新）
 *   currentSegmentStartTime - 当前 segment 开始时间（ms）
 *   recordingStartedAt   - 整个 recording 开始的 timestamp（resume 不重置）
 *   totalPausedMs        - 累计 paused 时长
 *   pausedAt             - 当前 paused 的 timestamp（resume 时清空）
 *   segmentCount         - 已切 segment 数
 */

import { logger } from "@/common/logger";
import type { V2Status } from "../types";

export interface V2CSState {
	status: V2Status;
	recordingUid?: string;
	recordingName?: string;
	currentSegmentUid?: string;
	currentSegmentStartTime?: number;
	recordingStartedAt?: number;
	totalPausedMs: number;
	pausedAt?: number;
	segmentCount: number;
}

let state: V2CSState = {
	status: "idle",
	totalPausedMs: 0,
	segmentCount: 0,
};

export function getState(): Readonly<V2CSState> {
	return state;
}

export function updateState(patch: Partial<V2CSState>): void {
	state = { ...state, ...patch };
	logger.cs.debug("state updated", state);
}

export function resetState(): void {
	state = { status: "idle", totalPausedMs: 0, segmentCount: 0 };
	logger.cs.info("state reset");
}
