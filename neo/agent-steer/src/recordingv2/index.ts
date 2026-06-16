/**
 * Recording v2 主入口
 *
 * 设计文档：design/docs/technical/agent-steer/recording.md
 *
 * 使用方式：
 *   import { RecordingUI } from "@/src/recordingv2";
 *   <RecordingUI />
 *
 * 当前阶段（v2 UI 第一步）：
 *   - 状态：复用 v1 useRecordingState，做 v1→v2 状态映射
 *   - 命令：Stub 内部调 v1 recordingActions
 *   - 后续阶段替换为 v2 自有 cs/sw 通道
 */

export { RecordingUI } from "./ui/RecordingUI";
export type { RecordingUIProps } from "./ui/RecordingUI";
export type { V2Status, V2RecordingState } from "./types";
