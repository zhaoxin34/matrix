/**
 * v2 视图状态 Hook
 *
 * 状态机 3 状态 → 视图 2 个：
 *   idle        → IdleView
 *   recording   → RecordingView（内部按 status 渲染）
 *   paused      → RecordingView（内部按 status 渲染）
 *
 * 设计文档：design/docs/technical/agent-steer/recording.md
 */

import type { V2Status } from "../../types";

export type V2View = "idle" | "active";

export function useViewState(status: V2Status): V2View {
	if (status === "idle") return "idle";
	return "active";
}
