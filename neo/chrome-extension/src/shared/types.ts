/**
 * Shared types between background, content, and extension
 */

/** Message types for communication between components */
export enum MessageType {
	// Recording
	START_RECORDING = "START_RECORDING",
	STOP_RECORDING = "STOP_RECORDING",
	PAUSE_RECORDING = "PAUSE_RECORDING",
	RESUME_RECORDING = "RESUME_RECORDING",

	// Learn Mode
	START_LEARN_MODE = "START_LEARN_MODE",
	STOP_LEARN_MODE = "STOP_LEARN_MODE",

	// Guide Mode
	START_GUIDE_MODE = "START_GUIDE_MODE",
	STOP_GUIDE_MODE = "STOP_GUIDE_MODE",

	// Active Mode
	START_ACTIVE_MODE = "START_ACTIVE_MODE",
	STOP_ACTIVE_MODE = "STOP_ACTIVE_MODE",

	// Playback
	START_PLAYBACK = "START_PLAYBACK",
	STOP_PLAYBACK = "STOP_PLAYBACK",

	// Operations
	EXECUTE_OPERATION = "EXECUTE_OPERATION",
	OPERATION_RESULT = "OPERATION_RESULT",

	// State
	STATE_UPDATE = "STATE_UPDATE",
	GET_STATE = "GET_STATE",

	// iframe communication
	IFRAME_READY = "IFRAME_READY",
	IFRAME_MESSAGE = "IFRAME_MESSAGE",

	// Storage
	SAVE_RECORDING = "SAVE_RECORDING",
	LOAD_RECORDING = "LOAD_RECORDING",
}

/** Message structure for component communication */
export interface AgentMessage {
	type: MessageType;
	payload: Record<string, unknown>;
	timestamp: number;
	messageId: string;
	correlationId?: string;
}

/** Recording state */
export interface RecordingState {
	isRecording: boolean;
	isPaused: boolean;
	sessionId: string | null;
	startTime: number | null;
	events: RecordingEvent[];
}

/** Recording event */
export interface RecordingEvent {
	type: string;
	timestamp: number;
	data: unknown;
}

/** Agent mode */
export enum AgentMode {
	LEARN = "learn",
	GUIDE = "guide",
	ACTIVE = "active",
}

/** Agent configuration */
export interface AgentConfig {
	mode: AgentMode;
	frontendUrl: string;
	backendUrl: string;
	enableRecording: boolean;
	enableOverlay: boolean;
}

/** Default configuration */
export const DEFAULT_CONFIG: AgentConfig = {
	mode: AgentMode.LEARN,
	frontendUrl: "http://localhost:3300",
	backendUrl: "http://localhost:8000",
	enableRecording: true,
	enableOverlay: true,
};

/** Message factory function */
export function createMessage(
	type: MessageType,
	payload: Record<string, unknown> = {},
	correlationId?: string,
): AgentMessage {
	return {
		type,
		payload,
		timestamp: Date.now(),
		messageId: crypto.randomUUID(),
		correlationId,
	};
}
