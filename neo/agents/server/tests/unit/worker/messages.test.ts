import { describe, it, expect } from "vitest";
import {
	type MainToWorker,
	type WorkerToMain,
	createInitMessage,
	createPromptMessage,
	createSteerMessage,
	createFollowUpMessage,
	createAbortMessage,
	createDestroyMessage,
	parseMainToWorkerMessage,
	parseWorkerMessage,
	isReadyMessage,
	isEventMessage,
	isErrorMessage,
	isDoneMessage,
} from "../../../src/worker/messages.js";

describe("Worker Messages", () => {
	describe("MainToWorker Messages", () => {
		describe("createInitMessage", () => {
			it("should create a valid init message", () => {
				const message = createInitMessage({
					sessionId: "session-123",
					cwd: "/tmp/test",
				});
				expect(message).toEqual({
					type: "init",
					sessionId: "session-123",
					cwd: "/tmp/test",
					options: {},
				});
			});

			it("should create init message with options", () => {
				const message = createInitMessage({
					sessionId: "session-123",
					cwd: "/tmp/test",
					options: { model: "claude-opus-4-5", thinkingLevel: "high" },
				});
				expect(message.options).toEqual({
					model: "claude-opus-4-5",
					thinkingLevel: "high",
				});
			});
		});

		describe("createPromptMessage", () => {
			it("should create a valid prompt message", () => {
				const message = createPromptMessage({ prompt: "List files" });
				expect(message).toEqual({
					type: "prompt",
					prompt: "List files",
					images: undefined,
				});
			});

			it("should create prompt message with images", () => {
				const images = [
					{
						type: "image" as const,
						source: {
							type: "base64" as const,
							mediaType: "image/png",
							data: "abc123",
						},
					},
				];
				const message = createPromptMessage({
					prompt: "What is this?",
					images,
				});
				expect(message.images).toEqual(images);
			});
		});

		describe("createSteerMessage", () => {
			it("should create a valid steer message", () => {
				const message = createSteerMessage({ text: "Stop and do this" });
				expect(message).toEqual({ type: "steer", text: "Stop and do this" });
			});
		});

		describe("createFollowUpMessage", () => {
			it("should create a valid followUp message", () => {
				const message = createFollowUpMessage({
					text: "After finish, also check X",
				});
				expect(message).toEqual({
					type: "followUp",
					text: "After finish, also check X",
				});
			});
		});

		describe("createAbortMessage", () => {
			it("should create a valid abort message", () => {
				const message = createAbortMessage();
				expect(message).toEqual({ type: "abort" });
			});
		});

		describe("createDestroyMessage", () => {
			it("should create a valid destroy message", () => {
				const message = createDestroyMessage();
				expect(message).toEqual({ type: "destroy" });
			});
		});
	});

	describe("WorkerToMain Messages", () => {
		describe("ReadyMessage", () => {
			it("should identify ready message", () => {
				const message: WorkerToMain = {
					type: "ready",
					sessionId: "session-123",
				};
				expect(isReadyMessage(message)).toBe(true);
				expect(message.sessionId).toBe("session-123");
			});

			it("should not identify other messages as ready", () => {
				const messages: WorkerToMain[] = [
					{ type: "event", event: { type: "agent_start" } },
					{ type: "error", error: "something went wrong" },
					{ type: "done" },
				];
				for (const msg of messages) expect(isReadyMessage(msg)).toBe(false);
			});
		});

		describe("EventMessage", () => {
			it("should identify event message", () => {
				const message: WorkerToMain = {
					type: "event",
					event: { type: "agent_start" },
				};
				expect(isEventMessage(message)).toBe(true);
			});

			it("should carry message_delta event with delta", () => {
				const message: WorkerToMain = {
					type: "event",
					event: {
						type: "message_delta",
						messageId: "msg-1",
						delta: "Hello, world!",
					},
				};
				expect(message.event.type).toBe("message_delta");
				expect((message.event as { delta?: string }).delta).toBe(
					"Hello, world!",
				);
			});
		});

		describe("ErrorMessage", () => {
			it("should identify error message", () => {
				const message: WorkerToMain = {
					type: "error",
					error: "Failed to create session",
				};
				expect(isErrorMessage(message)).toBe(true);
				expect(message.error).toBe("Failed to create session");
			});
		});

		describe("DoneMessage", () => {
			it("should identify done message", () => {
				const message: WorkerToMain = { type: "done" };
				expect(isDoneMessage(message)).toBe(true);
			});
		});
	});

	describe("parseMainToWorkerMessage", () => {
		it("should parse init message", () => {
			const input = JSON.stringify({
				type: "init",
				sessionId: "session-123",
				cwd: "/tmp",
				options: {},
			});
			const result = parseMainToWorkerMessage(input);
			expect(result.valid).toBe(true);
			if (result.valid) {
				expect(result.message.type).toBe("init");
				expect((result.message as { sessionId: string }).sessionId).toBe(
					"session-123",
				);
			}
		});

		it("should reject invalid message type", () => {
			const input = JSON.stringify({ type: "invalid_type", data: "test" });
			const result = parseMainToWorkerMessage(input);
			expect(result.valid).toBe(false);
		});

		it("should reject invalid JSON", () => {
			const result = parseMainToWorkerMessage("not valid json");
			expect(result.valid).toBe(false);
		});
	});

	describe("parseWorkerMessage", () => {
		it("should parse ready message", () => {
			const input = JSON.stringify({ type: "ready", sessionId: "session-123" });
			const result = parseWorkerMessage(input);
			expect(result.valid).toBe(true);
			if (result.valid) expect(result.message.type).toBe("ready");
		});

		it("should parse event message", () => {
			const input = JSON.stringify({
				type: "event",
				event: { type: "agent_start" },
			});
			const result = parseWorkerMessage(input);
			expect(result.valid).toBe(true);
		});

		it("should reject invalid message type", () => {
			const input = JSON.stringify({ type: "invalid_type", data: "test" });
			const result = parseWorkerMessage(input);
			expect(result.valid).toBe(false);
		});
	});

	describe("Type Compatibility", () => {
		it("MainToWorker should accept all message types", () => {
			const messages: MainToWorker[] = [
				createInitMessage({ sessionId: "s1", cwd: "/tmp" }),
				createPromptMessage({ prompt: "hello" }),
				createSteerMessage({ text: "steer" }),
				createFollowUpMessage({ text: "followUp" }),
				createAbortMessage(),
				createDestroyMessage(),
			];
			expect(messages.length).toBe(6);
		});

		it("WorkerToMain should accept all message types", () => {
			const messages: WorkerToMain[] = [
				{ type: "ready", sessionId: "s1" },
				{ type: "event", event: { type: "agent_start" } },
				{ type: "error", error: "error" },
				{ type: "done" },
			];
			expect(messages.length).toBe(4);
		});
	});
});
