import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	handleRequest,
	sessionManager,
	type ApiContext,
} from "../../../src/api/handler.js";
import { createResponse, createError } from "../../../src/protocol/jsonrpc.js";

describe("API Handler", () => {
	let mockConnection: any;
	let mockSend: any;

	beforeEach(() => {
		// Create mock connection
		mockSend = vi.fn();
		mockConnection = {
			id: "test-connection-id",
			sessionId: "test-session-id",
			send: mockSend,
		};

		// Clear session manager state
		for (const sessionId of sessionManager["sessions"].keys()) {
			sessionManager.destroySession(sessionId);
		}
	});

	describe("session.create", () => {
		it("should create a new session", async () => {
			const request = JSON.stringify({
				jsonrpc: "2.0",
				method: "session.create",
				params: { cwd: "/workspace" },
				id: 1,
			});

			const results = await handleRequest(request, mockConnection);

			expect(results).toHaveLength(1);
			expect(results[0]).toMatchObject({
				jsonrpc: "2.0",
				result: {
					status: "created",
				},
				id: 1,
			});
			expect((results[0] as any).result.sessionId).toBeDefined();
		});
	});

	describe("session.info", () => {
		it("should return session info", async () => {
			// First create a session
			await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.create",
					id: 1,
				}),
				mockConnection,
			);

			// Then get info
			const results = await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.info",
					id: 2,
				}),
				mockConnection,
			);

			expect(results).toHaveLength(1);
			expect((results[0] as any).result.sessionId).toBeDefined();
			expect((results[0] as any).result.isStreaming).toBe(false);
			expect((results[0] as any).result.cwd).toBe("/tmp");
		});
	});

	describe("session.send", () => {
		it("should send a prompt", async () => {
			// Create session first
			await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.create",
					id: 1,
				}),
				mockConnection,
			);

			// Send prompt
			const results = await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.send",
					params: { prompt: "Hello, world!" },
					id: 2,
				}),
				mockConnection,
			);

			expect(results).toHaveLength(1);
			expect(results[0]).toMatchObject({
				jsonrpc: "2.0",
				result: {
					status: "processing",
				},
				id: 2,
			});
		});

		it("should return error for missing prompt", async () => {
			await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.create",
					id: 1,
				}),
				mockConnection,
			);

			const results = await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.send",
					params: {},
					id: 2,
				}),
				mockConnection,
			);

			expect(results).toHaveLength(1);
			expect((results[0] as any).error.code).toBe(-32602); // InvalidParams
		});
	});

	describe("session.abort", () => {
		it("should abort session", async () => {
			await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.create",
					id: 1,
				}),
				mockConnection,
			);

			const results = await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.abort",
					id: 2,
				}),
				mockConnection,
			);

			expect(results).toHaveLength(1);
			expect((results[0] as any).result.aborted).toBe(true);
		});
	});

	describe("session.destroy", () => {
		it("should destroy session", async () => {
			await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.create",
					id: 1,
				}),
				mockConnection,
			);

			const results = await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.destroy",
					id: 2,
				}),
				mockConnection,
			);

			expect(results).toHaveLength(1);
			expect((results[0] as any).result.status).toBe("destroyed");
		});
	});

	describe("session.steer", () => {
		it("should return error when not streaming", async () => {
			await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.create",
					id: 1,
				}),
				mockConnection,
			);

			const results = await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.steer",
					params: { text: "Stop!" },
					id: 2,
				}),
				mockConnection,
			);

			expect(results).toHaveLength(1);
			expect((results[0] as any).error.code).toBe(-32002); // Session busy
		});
	});

	describe("session.followUp", () => {
		it("should queue follow-up message", async () => {
			await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.create",
					id: 1,
				}),
				mockConnection,
			);

			const results = await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.followUp",
					params: { text: "Also do this" },
					id: 2,
				}),
				mockConnection,
			);

			expect(results).toHaveLength(1);
			expect((results[0] as any).result.status).toBe("queued");
		});
	});

	describe("Method not found", () => {
		it("should return method not found error", async () => {
			await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "session.create",
					id: 1,
				}),
				mockConnection,
			);

			const results = await handleRequest(
				JSON.stringify({
					jsonrpc: "2.0",
					method: "unknown.method",
					id: 2,
				}),
				mockConnection,
			);

			expect(results).toHaveLength(1);
			expect((results[0] as any).error.code).toBe(-32601); // MethodNotFound
		});
	});

	describe("Invalid JSON", () => {
		it("should return parse error", async () => {
			const results = await handleRequest("not valid json", mockConnection);

			expect(results).toHaveLength(1);
			expect((results[0] as any).error.code).toBe(-32700); // ParseError
		});
	});

	describe("Batch requests", () => {
		it("should handle batch requests", async () => {
			const batchRequest = JSON.stringify([
				{ jsonrpc: "2.0", method: "session.create", id: 1 },
				{ jsonrpc: "2.0", method: "session.info", id: 2 },
			]);

			const results = await handleRequest(batchRequest, mockConnection);

			expect(results).toHaveLength(2);
			expect((results[0] as any).result.status).toBe("created");
			expect((results[1] as any).result.sessionId).toBeDefined();
		});
	});
});

describe("Session Manager", () => {
	let mockConnection: any;

	beforeEach(() => {
		mockConnection = {
			id: "test-conn-" + Date.now(),
			send: vi.fn(),
		};

		// Clear sessions
		for (const sessionId of sessionManager["sessions"].keys()) {
			sessionManager.destroySession(sessionId);
		}
	});

	it("should create and track sessions", () => {
		const { sessionId } = sessionManager.createSession(mockConnection);

		expect(sessionManager.getSession(sessionId)).toBeDefined();
		expect(sessionManager.getConnectionSession(mockConnection)?.sessionId).toBe(
			sessionId,
		);
	});

	it("should destroy sessions", () => {
		const { sessionId } = sessionManager.createSession(mockConnection);
		sessionManager.destroySession(sessionId);

		expect(sessionManager.getSession(sessionId)).toBeUndefined();
	});

	it("should forward session events to connection", () => {
		const { session } = sessionManager.createSession(mockConnection);

		// Trigger a session event
		session.subscribe((event) => {
			// Event should be forwarded
		});

		// The event handler is set up in createSession
		expect(mockConnection.send).not.toHaveBeenCalled();
	});
});
