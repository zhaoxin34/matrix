import { describe, it, expect } from "vitest";
import {
	createRequest,
	createResponse,
	createError,
	createNotification,
	parseMessage,
	createBatchResponse,
	createBatchRequest,
	isValidJsonRpc,
	JsonRpcErrorCode,
} from "../../../src/protocol/jsonrpc.js";

describe("JSON-RPC 2.0 Protocol", () => {
	describe("createRequest", () => {
		it("should create a valid request with params", () => {
			const request = createRequest("session.create", { cwd: "/tmp" }, "1");
			expect(request).toEqual({
				jsonrpc: "2.0",
				method: "session.create",
				params: { cwd: "/tmp" },
				id: "1",
			});
		});

		it("should create a valid request without params", () => {
			const request = createRequest("session.info", {}, "2");
			expect(request).toEqual({
				jsonrpc: "2.0",
				method: "session.info",
				params: {},
				id: "2",
			});
		});

		it("should create a valid request with null params", () => {
			const request = createRequest("session.abort", null, "3");
			expect(request).toEqual({
				jsonrpc: "2.0",
				method: "session.abort",
				params: null,
				id: "3",
			});
		});
	});

	describe("createResponse", () => {
		it("should create a valid success response", () => {
			const response = createResponse("1", { sessionId: "abc-123" });
			expect(response).toEqual({
				jsonrpc: "2.0",
				result: { sessionId: "abc-123" },
				id: "1",
			});
		});

		it("should create a valid response with null result", () => {
			const response = createResponse("1", null);
			expect(response).toEqual({ jsonrpc: "2.0", result: null, id: "1" });
		});
	});

	describe("createError", () => {
		it("should create a valid error response", () => {
			const error = createError(
				JsonRpcErrorCode.InvalidRequest,
				"Invalid params",
				"1",
			);
			expect(error).toEqual({
				jsonrpc: "2.0",
				error: { code: -32600, message: "Invalid params", data: undefined },
				id: "1",
			});
		});

		it("should include optional data", () => {
			const error = createError(
				JsonRpcErrorCode.InternalError,
				"Something went wrong",
				"1",
				{ stack: "error stack" },
			);
			expect(error.error.data).toEqual({ stack: "error stack" });
		});

		it("should support predefined error codes", () => {
			const errors = [
				{ code: JsonRpcErrorCode.ParseError, expected: -32700 },
				{ code: JsonRpcErrorCode.InvalidRequest, expected: -32600 },
				{ code: JsonRpcErrorCode.MethodNotFound, expected: -32601 },
				{ code: JsonRpcErrorCode.InvalidParams, expected: -32602 },
				{ code: JsonRpcErrorCode.InternalError, expected: -32603 },
				{ code: JsonRpcErrorCode.ServerError, expected: -32000 },
			];
			for (const { code, expected } of errors) {
				const error = createError(code, "test", "1");
				expect(error.error.code).toBe(expected);
			}
		});
	});

	describe("createNotification", () => {
		it("should create a valid notification with params", () => {
			const notification = createNotification("message.delta", {
				messageId: "m1",
				delta: "hello",
			});
			expect(notification).toEqual({
				jsonrpc: "2.0",
				method: "message.delta",
				params: { messageId: "m1", delta: "hello" },
			});
			expect("id" in notification).toBe(false);
		});

		it("should create a valid notification without params", () => {
			const notification = createNotification("agent.start", {});
			expect(notification).toEqual({
				jsonrpc: "2.0",
				method: "agent.start",
				params: {},
			});
		});
	});

	describe("parseMessage", () => {
		it("should parse a valid request", () => {
			const input = '{"jsonrpc":"2.0","method":"test","params":{},"id":"1"}';
			const result = parseMessage(input);
			expect(result.valid).toBe(true);
			if (result.valid) {
				expect(result.type).toBe("request");
				expect(result.message.method).toBe("test");
				expect(result.message.id).toBe("1");
			}
		});

		it("should parse a valid response", () => {
			const input = '{"jsonrpc":"2.0","result":{"ok":true},"id":"1"}';
			const result = parseMessage(input);
			expect(result.valid).toBe(true);
			if (result.valid) {
				expect(result.type).toBe("response");
				expect(result.message.result).toEqual({ ok: true });
			}
		});

		it("should parse a valid notification", () => {
			const input =
				'{"jsonrpc":"2.0","method":"message.delta","params":{"delta":"hi"}}';
			const result = parseMessage(input);
			expect(result.valid).toBe(true);
			if (result.valid) {
				expect(result.type).toBe("notification");
				expect(result.message.method).toBe("message.delta");
			}
		});

		it("should reject non-object messages", () => {
			for (const input of ['"string"', "123", "null", "[]"]) {
				const result = parseMessage(input);
				expect(result.valid).toBe(false);
			}
		});

		it("should reject messages without jsonrpc version", () => {
			const input = '{"method":"test","params":{},"id":"1"}';
			const result = parseMessage(input);
			expect(result.valid).toBe(false);
		});

		it("should handle invalid JSON", () => {
			const result = parseMessage("not valid json {");
			expect(result.valid).toBe(false);
			expect(result.error.code).toBe(JsonRpcErrorCode.ParseError);
		});
	});

	describe("isValidJsonRpc", () => {
		it("should return true for valid JSON-RPC 2.0 object", () => {
			expect(isValidJsonRpc({ jsonrpc: "2.0", method: "test", id: "1" })).toBe(
				true,
			);
		});

		it("should return false for missing jsonrpc", () => {
			expect(isValidJsonRpc({ method: "test", id: "1" })).toBe(false);
		});

		it("should return false for wrong version", () => {
			expect(isValidJsonRpc({ jsonrpc: "1.0", method: "test", id: "1" })).toBe(
				false,
			);
		});
	});

	describe("createBatchResponse", () => {
		it("should create a batch response", () => {
			const responses = [
				createResponse("1", { data: "first" }),
				createResponse("2", { data: "second" }),
			];
			const batch = createBatchResponse(responses);
			expect(batch.length).toBe(2);
		});
	});

	describe("createBatchRequest", () => {
		it("should create a batch request", () => {
			const batch = createBatchRequest([
				{ method: "test1", params: {}, id: "1" },
				{ method: "test2", params: {}, id: "2" },
			]);
			expect(batch.length).toBe(2);
			expect(batch[0].method).toBe("test1");
		});
	});
});
