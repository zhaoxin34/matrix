/**
 * Worker Communication Protocol
 */

export interface SessionOptions {
	cwd?: string;
	model?: string;
	thinkingLevel?: "off" | "minimal" | "low" | "medium" | "high" | "xhigh";
	tools?: string[];
	systemPrompt?: string;
}

export interface ImageContent {
	type: "image";
	source: { type: "base64"; mediaType: string; data: string };
}

export type MainToWorker =
	| InitMessage
	| PromptMessage
	| SteerMessage
	| FollowUpMessage
	| AbortMessage
	| DestroyMessage;

export interface InitMessage {
	type: "init";
	sessionId: string;
	cwd: string;
	options: SessionOptions;
}

export interface PromptMessage {
	type: "prompt";
	prompt: string;
	images?: ImageContent[];
}

export interface SteerMessage {
	type: "steer";
	text: string;
}

export interface FollowUpMessage {
	type: "followUp";
	text: string;
}

export interface AbortMessage {
	type: "abort";
}

export interface DestroyMessage {
	type: "destroy";
}

export type WorkerToMain =
	| ReadyMessage
	| EventMessage
	| ErrorMessage
	| DoneMessage;

export interface ReadyMessage {
	type: "ready";
	sessionId: string;
}

export interface EventMessage {
	type: "event";
	event: AgentSessionEvent;
}

export interface ErrorMessage {
	type: "error";
	error: string;
}

export interface DoneMessage {
	type: "done";
}

export type AgentSessionEvent =
	| AgentStartEvent
	| AgentEndEvent
	| MessageStartEvent
	| MessageDeltaEvent
	| MessageThinkingEvent
	| MessageEndEvent
	| ToolStartEvent
	| ToolUpdateEvent
	| ToolEndEvent
	| QueueUpdateEvent;

export interface AgentStartEvent {
	type: "agent_start";
}
export interface AgentEndEvent {
	type: "agent_end";
	messages: unknown[];
}
export interface MessageStartEvent {
	type: "message_start";
	messageId: string;
	role: "user" | "assistant" | "system" | "tool";
}
export interface MessageDeltaEvent {
	type: "message_delta";
	messageId: string;
	delta: string;
}
export interface MessageThinkingEvent {
	type: "message_thinking";
	messageId: string;
	delta: string;
}
export interface MessageEndEvent {
	type: "message_end";
	messageId: string;
}
export interface ToolStartEvent {
	type: "tool_start";
	toolCallId: string;
	name: string;
	args: Record<string, unknown>;
}
export interface ToolUpdateEvent {
	type: "tool_update";
	toolCallId: string;
	output: string;
}
export interface ToolEndEvent {
	type: "tool_end";
	toolCallId: string;
	isError: boolean;
}
export interface QueueUpdateEvent {
	type: "queue_update";
	steer?: string;
	followUp?: string;
}

export function createInitMessage(params: {
	sessionId: string;
	cwd: string;
	options?: SessionOptions;
}): InitMessage {
	return {
		type: "init",
		sessionId: params.sessionId,
		cwd: params.cwd,
		options: params.options ?? {},
	};
}

export function createPromptMessage(params: {
	prompt: string;
	images?: ImageContent[];
}): PromptMessage {
	return { type: "prompt", prompt: params.prompt, images: params.images };
}

export function createSteerMessage(params: { text: string }): SteerMessage {
	return { type: "steer", text: params.text };
}

export function createFollowUpMessage(params: {
	text: string;
}): FollowUpMessage {
	return { type: "followUp", text: params.text };
}

export function createAbortMessage(): AbortMessage {
	return { type: "abort" };
}

export function createDestroyMessage(): DestroyMessage {
	return { type: "destroy" };
}

export function isReadyMessage(msg: WorkerToMain): msg is ReadyMessage {
	return msg.type === "ready";
}
export function isEventMessage(msg: WorkerToMain): msg is EventMessage {
	return msg.type === "event";
}
export function isErrorMessage(msg: WorkerToMain): msg is ErrorMessage {
	return msg.type === "error";
}
export function isDoneMessage(msg: WorkerToMain): msg is DoneMessage {
	return msg.type === "done";
}
export function isInitMessage(msg: MainToWorker): msg is InitMessage {
	return msg.type === "init";
}
export function isPromptMessage(msg: MainToWorker): msg is PromptMessage {
	return msg.type === "prompt";
}
export function isSteerMessage(msg: MainToWorker): msg is SteerMessage {
	return msg.type === "steer";
}
export function isFollowUpMessage(msg: MainToWorker): msg is FollowUpMessage {
	return msg.type === "followUp";
}
export function isAbortMessage(msg: MainToWorker): msg is AbortMessage {
	return msg.type === "abort";
}
export function isDestroyMessage(msg: MainToWorker): msg is DestroyMessage {
	return msg.type === "destroy";
}

const VALID_MAIN_TO_WORKER_TYPES = [
	"init",
	"prompt",
	"steer",
	"followUp",
	"abort",
	"destroy",
];
const VALID_WORKER_TO_MAIN_TYPES = ["ready", "event", "error", "done"];

export interface ParseResult<T> {
	valid: true;
	message: T;
}
export interface ParseError {
	valid: false;
	error: string;
}

export function parseMainToWorkerMessage(
	input: string,
): ParseResult<MainToWorker> | ParseError {
	let parsed: unknown;
	try {
		parsed = JSON.parse(input);
	} catch {
		return { valid: false, error: "Invalid JSON" };
	}
	if (typeof parsed !== "object" || parsed === null)
		return { valid: false, error: "Message must be an object" };
	const obj = parsed as Record<string, unknown>;
	if (typeof obj.type !== "string")
		return { valid: false, error: "Missing type field" };
	if (!VALID_MAIN_TO_WORKER_TYPES.includes(obj.type))
		return { valid: false, error: `Invalid message type: ${obj.type}` };
	return { valid: true, message: parsed as MainToWorker };
}

export function parseWorkerMessage(
	input: string,
): ParseResult<WorkerToMain> | ParseError {
	let parsed: unknown;
	try {
		parsed = JSON.parse(input);
	} catch {
		return { valid: false, error: "Invalid JSON" };
	}
	if (typeof parsed !== "object" || parsed === null)
		return { valid: false, error: "Message must be an object" };
	const obj = parsed as Record<string, unknown>;
	if (typeof obj.type !== "string")
		return { valid: false, error: "Missing type field" };
	if (!VALID_WORKER_TO_MAIN_TYPES.includes(obj.type))
		return { valid: false, error: `Invalid message type: ${obj.type}` };
	return { valid: true, message: parsed as WorkerToMain };
}
