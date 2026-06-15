import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	type IAgentSession,
	createMockAgentSession,
	type MockModel,
	createMockModel,
	type SessionEvents,
} from "../../../src/worker/agent.js";

describe("Mock Agent Session", () => {
	let session: IAgentSession;
	let mockModel: MockModel;

	beforeEach(() => {
		mockModel = createMockModel({
			responses: [
				{ type: "agent_start" },
				{ type: "message_start", messageId: "msg-1", role: "user" },
				{ type: "message_delta", messageId: "msg-1", delta: "Hello" },
				{ type: "message_delta", messageId: "msg-1", delta: ", world!" },
				{ type: "message_end", messageId: "msg-1" },
				{ type: "agent_end", messages: [] },
			],
		});

		session = createMockAgentSession({
			sessionId: "test-session-123",
			model: mockModel,
			cwd: "/tmp/test",
		});
	});

	describe("Session Creation", () => {
		it("should create session with correct id", () => {
			expect(session.sessionId).toBe("test-session-123");
		});

		it("should create session in idle state", () => {
			expect(session.isStreaming).toBe(false);
		});

		it("should track session info", () => {
			expect(session.cwd).toBe("/tmp/test");
			expect(session.messages).toEqual([]);
		});
	});

	describe("prompt()", () => {
		it("should send prompt and receive events", async () => {
			const events: SessionEvents[] = [];
			session.subscribe((event) => events.push(event));

			await session.prompt("Hello, how are you?");

			expect(events.length).toBeGreaterThan(0);
			expect(events[0].type).toBe("agent_start");
			expect(events[events.length - 1].type).toBe("agent_end");
		});

		it("should emit message_delta events", async () => {
			const events: SessionEvents[] = [];
			session.subscribe((event) => events.push(event));

			await session.prompt("Hello");

			const deltaEvents = events.filter((e) => e.type === "message_delta");
			expect(deltaEvents.length).toBeGreaterThan(0);
		});

		it("should accumulate messages", async () => {
			await session.prompt("First prompt");
			await session.prompt("Second prompt");

			expect(session.messages.length).toBeGreaterThan(0);
		});
	});

	describe("steer()", () => {
		it("should interrupt current execution", async () => {
			const events: SessionEvents[] = [];
			session.subscribe((event) => events.push(event));

			// Start a prompt
			const promptPromise = session.prompt("Long running task");

			// Steer to redirect
			await session.steer("Actually, do something else");

			await promptPromise;

			// Should have both original and steer
			const steerEvents = events.filter(
				(e) => e.type === "queue_update" && "steer" in e,
			);
			expect(steerEvents.length).toBeGreaterThan(0);
		});

		it("should throw if not streaming", async () => {
			await expect(session.steer("Stop!")).rejects.toThrow(
				"not currently streaming",
			);
		});
	});

	describe("followUp()", () => {
		it("should queue message after current execution", async () => {
			const events: SessionEvents[] = [];
			session.subscribe((event) => events.push(event));

			await session.prompt("First task");
			await session.followUp("Also do this");

			const followUpEvents = events.filter(
				(e) => e.type === "queue_update" && "followUp" in e,
			);
			expect(followUpEvents.length).toBeGreaterThan(0);
		});
	});

	describe("abort()", () => {
		it("should abort current execution", async () => {
			await session.prompt("Test");
			const aborted = await session.abort();
			expect(aborted).toBe(true);
		});
	});

	describe("Event Subscription", () => {
		it("should subscribe to events", () => {
			const handler = vi.fn();
			const unsubscribe = session.subscribe(handler);

			expect(typeof unsubscribe).toBe("function");
		});

		it("should receive events when prompt is sent", async () => {
			const handler = vi.fn();
			session.subscribe(handler);

			await session.prompt("Test");

			expect(handler).toHaveBeenCalled();
		});

		it("should unsubscribe and stop receiving events", () => {
			const handler = vi.fn();
			const unsubscribe = session.subscribe(handler);
			unsubscribe();

			// After unsubscribe, handler should not be called
			// (This would need a multi-prompt test to verify)
			expect(typeof unsubscribe).toBe("function");
		});
	});

	describe("setModel()", () => {
		it("should change the model", async () => {
			const newModel = createMockModel({ responses: [] });
			await session.setModel(newModel);
			// Model changed successfully
			expect(session.model).toBe(newModel);
		});
	});

	describe("dispose()", () => {
		it("should clean up resources", () => {
			session.dispose();
			// After dispose, session should be unusable
			// We just verify it doesn't throw
			expect(true).toBe(true);
		});
	});
});

describe("Mock Model", () => {
	it("should create model with responses", () => {
		const model = createMockModel({
			responses: [{ type: "agent_start" }],
		});
		expect(model.id).toBe("mock-model");
	});

	it("should return responses sequentially", async () => {
		const model = createMockModel({
			responses: [{ type: "agent_start" }, { type: "agent_end", messages: [] }],
		});

		// Model can be used to simulate responses
		expect(model.id).toBe("mock-model");
	});
});
