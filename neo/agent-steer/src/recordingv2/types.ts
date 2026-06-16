/**
 * Recording v2 类型定义
 *
 * 状态机：3 状态（idle / recording / paused）
 * 设计文档：design/docs/technical/agent-steer/recording.md
 */

/** 录制状态（v2） */
export type V2Status = "idle" | "recording" | "paused";

/** 录制状态（v2） */
export interface V2RecordingState {
	status: V2Status;
	duration: number; // 录制时长（毫秒）
	segmentCount: number; // 片段数量
	recordingUid?: string; // 后端 recording 身份（v2 阶段 4 由 CS 推上来）
	currentSegmentUid?: string; // 当前 segment 身份
}
