// Agent Steer 类型定义

// 模式类型
export type AgentMode = "learn" | "guide" | "active";

// 录制状态类型
export type RecordingState = "idle" | "recording" | "paused";

// 回放状态类型
export type PlaybackState = "idle" | "playing" | "paused";

// 组合状态类型（用于状态显示）
export type StatusType = RecordingState | PlaybackState | "idle";

// Agent Steer 状态
export interface AgentSteerState {
	mode: AgentMode;
	recordingState: RecordingState;
	playbackState: PlaybackState;
	duration: number; // 秒
	eventCount: number;
	playbackProgress: number; // 0-100
	totalDuration: number; // 总时长（回放用）
	currentAction?: string; // 当前操作描述
}

// 消息类型
export type CommandType =
	| "START_RECORDING"
	| "STOP_RECORDING"
	| "PAUSE_RECORDING"
	| "RESUME_RECORDING"
	| "SET_MODE"
	| "GET_STATE";

export type EventType =
	| "STATE_UPDATE"
	| "RECORDING_EVENT"
	| "OPERATION_COMPLETED"
	| "OPERATION_FAILED"
	| "CONFIG_UPDATED";

// 消息格式
export interface AgentMessage {
	type: CommandType | EventType;
	payload: Record<string, unknown>;
	timestamp: number;
	messageId: string;
}

// 模式信息
export const MODE_INFO: Record<
	AgentMode,
	{ label: string; icon: string; description: string }
> = {
	learn: {
		label: "学习",
		icon: "📚",
		description: "录制用户操作，用于后续分析和回放",
	},
	guide: {
		label: "指导",
		icon: "🎥",
		description: "根据历史录制提供实时提示和引导",
	},
	active: {
		label: "主动",
		icon: "🚀",
		description: "Agent 自动执行，用户可随时接管",
	},
};

// 状态信息
export const STATUS_INFO: Record<StatusType, { label: string; color: string }> =
	{
		idle: {
			label: "空闲",
			color: "gray",
		},
		recording: {
			label: "录制中",
			color: "green",
		},
		paused: {
			label: "已暂停",
			color: "yellow",
		},
		playing: {
			label: "回放中",
			color: "blue",
		},
	};

// 格式化时长 (秒 -> HH:MM:SS)
export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	return [hours, minutes, secs]
		.map((v) => v.toString().padStart(2, "0"))
		.join(":");
}
