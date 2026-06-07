/**
 * Shared Types Unit Tests
 * Tests for MessageType, AgentMode, createMessage, and type definitions
 */

import { describe, it, expect } from "vitest";
import {
	MessageType,
	AgentMode,
	AgentConfig,
	DEFAULT_CONFIG,
	createMessage,
	type AgentMessage,
	type RecordingState,
	type RecordingEvent,
} from "../../src/shared/types";

describe("MessageType Enum", () => {
	it("should have all recording message types", () => {
		expect(MessageType.START_RECORDING).toBe("START_RECORDING");
		expect(MessageType.STOP_RECORDING).toBe("STOP_RECORDING");
		expect(MessageType.PAUSE_RECORDING).toBe("PAUSE_RECORDING");
		expect(MessageType.RESUME_RECORDING).toBe("RESUME_RECORDING");
	});

	it("should have all learn mode message types", () => {
		expect(MessageType.START_LEARN_MODE).toBe("START_LEARN_MODE");
		expect(MessageType.STOP_LEARN_MODE).toBe("STOP_LEARN_MODE");
	});

	it("should have all guide mode message types", () => {
		expect(MessageType.START_GUIDE_MODE).toBe("START_GUIDE_MODE");
		expect(MessageType.STOP_GUIDE_MODE).toBe("STOP_GUIDE_MODE");
	});

	it("should have all active mode message types", () => {
		expect(MessageType.START_ACTIVE_MODE).toBe("START_ACTIVE_MODE");
		expect(MessageType.STOP_ACTIVE_MODE).toBe("STOP_ACTIVE_MODE");
	});

	it("should have operation message types", () => {
		expect(MessageType.EXECUTE_OPERATION).toBe("EXECUTE_OPERATION");
		expect(MessageType.OPERATION_RESULT).toBe("OPERATION_RESULT");
	});

	it("should have state message types", () => {
		expect(MessageType.STATE_UPDATE).toBe("STATE_UPDATE");
		expect(MessageType.GET_STATE).toBe("GET_STATE");
	});

	it("should have iframe communication message types", () => {
		expect(MessageType.IFRAME_READY).toBe("IFRAME_READY");
		expect(MessageType.IFRAME_MESSAGE).toBe("IFRAME_MESSAGE");
	});

	it("should have storage message types", () => {
		expect(MessageType.SAVE_RECORDING).toBe("SAVE_RECORDING");
		expect(MessageType.LOAD_RECORDING).toBe("LOAD_RECORDING");
	});
});

describe("AgentMode Enum", () => {
	it("should have learn mode", () => {
		expect(AgentMode.LEARN).toBe("learn");
	});

	it("should have guide mode", () => {
		expect(AgentMode.GUIDE).toBe("guide");
	});

	it("should have active mode", () => {
		expect(AgentMode.ACTIVE).toBe("active");
	});

	it("should have 3 modes total", () => {
		const modes = Object.values(AgentMode);
		expect(modes).toHaveLength(3);
	});
});

describe("AgentConfig Interface", () => {
	it("should have correct default values", () => {
		expect(DEFAULT_CONFIG.mode).toBe(AgentMode.LEARN);
		expect(DEFAULT_CONFIG.frontendUrl).toBe("http://localhost:3300");
		expect(DEFAULT_CONFIG.backendUrl).toBe("http://localhost:8000");
		expect(DEFAULT_CONFIG.enableRecording).toBe(true);
		expect(DEFAULT_CONFIG.enableOverlay).toBe(true);
	});

	it("should accept partial config update", () => {
		const config: AgentConfig = {
			...DEFAULT_CONFIG,
			mode: AgentMode.ACTIVE,
			enableRecording: false,
		};

		expect(config.mode).toBe(AgentMode.ACTIVE);
		expect(config.enableRecording).toBe(false);
		expect(config.frontendUrl).toBe("http://localhost:3300");
	});
});

describe("createMessage Factory Function", () => {
	it("should create message with required fields", () => {
		const message = createMessage(MessageType.GET_STATE);

		expect(message).toHaveProperty("type", MessageType.GET_STATE);
		expect(message).toHaveProperty("payload");
		expect(message).toHaveProperty("timestamp");
		expect(message).toHaveProperty("messageId");
		expect(typeof message.timestamp).toBe("number");
		expect(typeof message.messageId).toBe("string");
	});

	it("should create message with payload", () => {
		const payload = { foo: "bar", count: 42 };
		const message = createMessage(MessageType.STATE_UPDATE, payload);

		expect(message.payload).toEqual(payload);
	});

	it("should create message with correlationId", () => {
		const correlationId = "corr-123";
		const message = createMessage(
			MessageType.EXECUTE_OPERATION,
			{},
			correlationId,
		);

		expect(message.correlationId).toBe(correlationId);
	});

	it("should generate unique messageId for each call", () => {
		const message1 = createMessage(MessageType.GET_STATE);
		const message2 = createMessage(MessageType.GET_STATE);

		expect(message1.messageId).not.toBe(message2.messageId);
	});

	it("should set timestamp to current time", () => {
		const before = Date.now();
		const message = createMessage(MessageType.STATE_UPDATE);
		const after = Date.now();

		expect(message.timestamp).toBeGreaterThanOrEqual(before);
		expect(message.timestamp).toBeLessThanOrEqual(after);
	});

	it("should create message with complex payload", () => {
		const payload = {
			config: DEFAULT_CONFIG,
			isRecording: true,
			sessionId: "session-abc",
			events: [{ type: "click", timestamp: 1000 }],
		};
		const message = createMessage(MessageType.STATE_UPDATE, payload);

		expect(message.payload).toEqual(payload);
		expect((message.payload as typeof payload).isRecording).toBe(true);
	});
});

describe("AgentMessage Interface", () => {
	it("should accept valid AgentMessage structure", () => {
		const message: AgentMessage = {
			type: MessageType.EXECUTE_OPERATION,
			payload: {
				action: "click",
				selector: "#button",
			},
			timestamp: Date.now(),
			messageId: "msg-123",
		};

		expect(message.type).toBe(MessageType.EXECUTE_OPERATION);
		expect(message.payload.action).toBe("click");
	});

	it("should accept AgentMessage with correlationId", () => {
		const message: AgentMessage = {
			type: MessageType.IFRAME_MESSAGE,
			payload: { data: "test" },
			timestamp: Date.now(),
			messageId: "msg-456",
			correlationId: "corr-789",
		};

		expect(message.correlationId).toBe("corr-789");
	});
});

describe("RecordingState Interface", () => {
	it("should have correct structure", () => {
		const state: RecordingState = {
			isRecording: true,
			isPaused: false,
			sessionId: "session-123",
			startTime: 1000,
			events: [],
		};

		expect(state.isRecording).toBe(true);
		expect(state.isPaused).toBe(false);
		expect(state.sessionId).toBe("session-123");
		expect(state.startTime).toBe(1000);
		expect(Array.isArray(state.events)).toBe(true);
	});
});

describe("RecordingEvent Interface", () => {
	it("should have correct structure", () => {
		const event: RecordingEvent = {
			type: "click",
			timestamp: 1000,
			data: { x: 100, y: 200 },
		};

		expect(event.type).toBe("click");
		expect(event.timestamp).toBe(1000);
		expect(event.data).toEqual({ x: 100, y: 200 });
	});
});

describe("Message Type Validation", () => {
	it("should be able to switch on MessageType values", () => {
		const testMessage = (type: MessageType) => {
			switch (type) {
				case MessageType.START_RECORDING:
					return "start";
				case MessageType.STOP_RECORDING:
					return "stop";
				case MessageType.PAUSE_RECORDING:
					return "pause";
				case MessageType.RESUME_RECORDING:
					return "resume";
				default:
					return "unknown";
			}
		};

		expect(testMessage(MessageType.START_RECORDING)).toBe("start");
		expect(testMessage(MessageType.STOP_RECORDING)).toBe("stop");
		expect(testMessage(MessageType.PAUSE_RECORDING)).toBe("pause");
		expect(testMessage(MessageType.RESUME_RECORDING)).toBe("resume");
		expect(testMessage(MessageType.GET_STATE)).toBe("unknown");
	});

	it("should be able to switch on AgentMode values", () => {
		const getModeName = (mode: AgentMode) => {
			switch (mode) {
				case AgentMode.LEARN:
					return "Learning Mode";
				case AgentMode.GUIDE:
					return "Guide Mode";
				case AgentMode.ACTIVE:
					return "Active Mode";
			}
		};

		expect(getModeName(AgentMode.LEARN)).toBe("Learning Mode");
		expect(getModeName(AgentMode.GUIDE)).toBe("Guide Mode");
		expect(getModeName(AgentMode.ACTIVE)).toBe("Active Mode");
	});
});
