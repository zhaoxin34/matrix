/**
 * Agent Session Abstraction
 *
 * This module provides a mock implementation of AgentSession for testing
 * and a framework for the real implementation using pi-agent SDK.
 *
 * The real implementation would use:
 * - createAgentSession() from @earendil-works/pi-coding-agent
 * - Model from @earendil-works/pi-ai
 */

import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { createLogger } from "../utils/logger.js";

// ========== Types ==========

export type ThinkingLevel =
	| "off"
	| "minimal"
	| "low"
	| "medium"
	| "high"
	| "xhigh";

export interface Model {
	id: string;
	provider: string;
}

export interface AgentMessage {
	id: string;
	role: "user" | "assistant" | "system" | "tool";
	content: unknown;
}

export type SessionEvents =
	| { type: "agent_start" }
	| { type: "agent_end"; messages: AgentMessage[] }
	| { type: "message_start"; messageId: string; role: string }
	| { type: "message_delta"; messageId: string; delta: string }
	| { type: "message_thinking"; messageId: string; delta: string }
	| { type: "message_end"; messageId: string }
	| {
			type: "tool_start";
			toolCallId: string;
			name: string;
			args: Record<string, unknown>;
	  }
	| { type: "tool_update"; toolCallId: string; output: string }
	| { type: "tool_end"; toolCallId: string; isError: boolean }
	| { type: "queue_update"; steer?: string; followUp?: string };

export interface SessionOptions {
	sessionId?: string;
	cwd?: string;
	model?: MockModel;
	thinkingLevel?: ThinkingLevel;
}

export interface MockModel {
	id: string;
	provider: string;
	responses: Partial<SessionEvents>[];
}

// ========== Factory Functions ==========

export function createMockModel(
	options: { responses?: Partial<SessionEvents>[] } = {},
): MockModel {
	return {
		id: "mock-model",
		provider: "mock",
		responses: options.responses ?? [],
	};
}

export function createMockAgentSession(
	options: SessionOptions = {},
): IAgentSession {
	return new MockAgentSessionImpl(options);
}

// ========== Mock Agent Session ==========

export interface IAgentSession {
	sessionId: string;
	cwd: string;
	model: MockModel;
	isStreaming: boolean;
	messages: AgentMessage[];
	thinkingLevel: ThinkingLevel;

	prompt(
		text: string,
		options?: { streamingBehavior?: "steer" | "followUp" },
	): Promise<void>;
	steer(text: string): Promise<void>;
	followUp(text: string): Promise<void>;
	abort(): Promise<boolean>;
	setModel(model: MockModel): Promise<void>;
	setThinkingLevel(level: ThinkingLevel): void;
	subscribe(handler: (event: SessionEvents) => void): () => void;
	dispose(): void;
}

class MockAgentSessionImpl implements IAgentSession {
	public sessionId: string;
	public cwd: string;
	public model: MockModel;
	public isStreaming: boolean = false;
	public messages: AgentMessage[] = [];
	public thinkingLevel: ThinkingLevel;

	private emitter: EventEmitter;
	private pendingSteer: string | null = null;
	private pendingFollowUp: string | null = null;
	private aborted: boolean = false;
	private log = createLogger("MockSession");

	constructor(options: SessionOptions = {}) {
		this.sessionId = options.sessionId ?? uuidv4();
		this.cwd = options.cwd ?? "/tmp";
		this.model = options.model ?? createMockModel();
		this.thinkingLevel = options.thinkingLevel ?? "medium";
		this.emitter = new EventEmitter();
		this.log.debug(`Session created: ${this.sessionId}`);
	}

	async prompt(
		text: string,
		options?: { streamingBehavior?: "steer" | "followUp" },
	): Promise<void> {
		if (this.isStreaming && !options?.streamingBehavior) {
			throw new Error(
				"Session is currently streaming. Use steer() or followUp().",
			);
		}

		this.isStreaming = true;
		this.aborted = false;
		this.log.debug(`Prompt: ${text.substring(0, 50)}...`);

		// Add user message
		const userMsg: AgentMessage = {
			id: uuidv4(),
			role: "user",
			content: text,
		};
		this.messages.push(userMsg);

		// Emit agent start
		this.emit({ type: "agent_start" });

		// Process queued steer/followUp
		if (this.pendingSteer) {
			this.emit({ type: "queue_update", steer: this.pendingSteer });
			this.pendingSteer = null;
		}
		if (this.pendingFollowUp) {
			this.emit({ type: "queue_update", followUp: this.pendingFollowUp });
			this.pendingFollowUp = null;
		}

		// Simulate responses from model
		for (const response of this.model.responses) {
			if (this.aborted) break;

			const event = { ...response } as SessionEvents;
			this.emit(event);

			// Check for pending steer after each event
			if (this.pendingSteer) {
				this.emit({ type: "queue_update", steer: this.pendingSteer });
				this.pendingSteer = null;
			}

			// Small delay to simulate streaming
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		// Emit agent end
		if (!this.aborted) {
			this.emit({ type: "agent_end", messages: this.messages });

			// Add assistant message
			this.messages.push({
				id: uuidv4(),
				role: "assistant",
				content: "Mock response",
			});
		}

		this.isStreaming = false;
		this.log.debug("Prompt completed");
	}

	async steer(text: string): Promise<void> {
		if (!this.isStreaming) {
			throw new Error("Cannot steer: session is not currently streaming");
		}
		this.pendingSteer = text;
		this.log.debug(`Steer queued: ${text.substring(0, 50)}...`);
	}

	async followUp(text: string): Promise<void> {
		if (this.isStreaming) {
			this.pendingFollowUp = text;
			this.log.debug(`FollowUp queued: ${text.substring(0, 50)}...`);
		} else {
			// If not streaming, just emit queue_update
			this.emit({ type: "queue_update", followUp: text });
		}
	}

	async abort(): Promise<boolean> {
		this.aborted = true;
		this.isStreaming = false;
		this.log.debug("Session aborted");
		return true;
	}

	async setModel(model: MockModel): Promise<void> {
		this.model = model;
		this.log.debug(`Model changed to: ${model.id}`);
	}

	setThinkingLevel(level: ThinkingLevel): void {
		this.thinkingLevel = level;
		this.log.debug(`Thinking level set to: ${level}`);
	}

	subscribe(handler: (event: SessionEvents) => void): () => void {
		this.emitter.on("event", handler);
		return () => {
			this.emitter.off("event", handler);
		};
	}

	dispose(): void {
		this.log.debug(`Session disposed: ${this.sessionId}`);
		this.emitter.removeAllListeners();
		this.messages = [];
	}

	private emit(event: SessionEvents): void {
		this.emitter.emit("event", event);
	}
}

// ========== Real Implementation Placeholder ==========

/**
 * Real AgentSession implementation using pi-agent SDK
 *
 * This would be implemented in a separate file that imports:
 * - createAgentSession from @earendil-works/pi-coding-agent
 * - Model from @earendil-works/pi-ai
 *
 * For now, use createMockAgentSession() for testing
 */
export async function createAgentSession(options: {
	cwd?: string;
	model?: Model;
	thinkingLevel?: ThinkingLevel;
}): Promise<IAgentSession> {
	// Placeholder - real implementation would use pi-agent SDK
	return createMockAgentSession({
		cwd: options.cwd,
		thinkingLevel: options.thinkingLevel,
	});
}
