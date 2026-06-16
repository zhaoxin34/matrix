/**
 * v2 录制状态 Hook
 *
 * 当前阶段：复用 v1 useRecordingState，做 v1 → v2 状态映射。
 * 后续阶段：替换为 v2 cs/sw 通道直接拿状态。
 *
 * v1 → v2 状态映射：
 *   recording            → recording
 *   paused               → paused
 *   其他（idle/pending/  → idle
 *         uploading/
 *         success/error）
 *
 * v2 流程下不应该出现 pending/uploading/success/error，
 * 这里保守地把它们都视作 idle。
 */

import { useRecordingState as useV1RecordingState } from "@/src/recording";
import type { V2RecordingState, V2Status } from "../../types";

type V1Status =
	| "idle"
	| "recording"
	| "paused"
	| "pending"
	| "uploading"
	| "success"
	| "error";

function mapStatus(v1Status: V1Status): V2Status {
	if (v1Status === "recording") return "recording";
	if (v1Status === "paused") return "paused";
	return "idle";
}

export function useRecordingState(): { state: V2RecordingState } {
	const { recordingState: v1State } = useV1RecordingState();
	return {
		state: {
			status: mapStatus(v1State.status as V1Status),
			duration: v1State.duration,
			segmentCount: v1State.segmentCount,
		},
	};
}
