/**
 * JSON-RPC 2.0 Protocol Implementation
 */

export enum JsonRpcErrorCode {
	ParseError = -32700,
	InvalidRequest = -32600,
	MethodNotFound = -32601,
	InvalidParams = -32602,
	InternalError = -32603,
	ServerError = -32000,
}

export interface JsonRpcRequest {
	jsonrpc: "2.0";
	method: string;
	params?: Record<string, unknown> | null;
	id: string | number;
}

export interface JsonRpcResponse {
	jsonrpc: "2.0";
	result: unknown;
	id: string | number;
}

export interface JsonRpcError {
	code: number;
	message: string;
	data?: unknown;
}

export interface JsonRpcErrorResponse {
	jsonrpc: "2.0";
	error: JsonRpcError;
	id: string | number | null;
}

export interface JsonRpcNotification {
	jsonrpc: "2.0";
	method: string;
	params?: Record<string, unknown>;
}

export type JsonRpcMessage =
	| JsonRpcRequest
	| JsonRpcResponse
	| JsonRpcErrorResponse
	| JsonRpcNotification;

export interface ParseResult {
	valid: true;
	type: "request" | "response" | "notification";
	message: JsonRpcMessage;
}

export interface ParseErrorResult {
	valid: false;
	error: JsonRpcError;
}

export function createRequest<
	T extends Record<string, unknown> = Record<string, unknown>,
>(method: string, params: T | null, id: string | number): JsonRpcRequest {
	return {
		jsonrpc: "2.0",
		method,
		params: params === null ? null : (params as Record<string, unknown>),
		id,
	};
}

export function createResponse<T = unknown>(
	id: string | number,
	result: T,
): JsonRpcResponse {
	return { jsonrpc: "2.0", result, id };
}

export function createError(
	code: number,
	message: string,
	id: string | number | null,
	data?: unknown,
): JsonRpcErrorResponse {
	return {
		jsonrpc: "2.0",
		error: { code, message, data },
		id,
	};
}

export function createNotification<
	T extends Record<string, unknown> = Record<string, unknown>,
>(method: string, params?: T): JsonRpcNotification {
	return { jsonrpc: "2.0", method, params };
}

export function createBatchResponse(
	responses: JsonRpcResponse[],
): JsonRpcResponse[] {
	return responses;
}

export function createBatchRequest(
	requests: Array<{
		method: string;
		params?: Record<string, unknown>;
		id: string | number;
	}>,
): JsonRpcRequest[] {
	return requests.map((r) => createRequest(r.method, r.params ?? null, r.id));
}

export function isValidJsonRpc(obj: unknown): obj is { jsonrpc: "2.0" } {
	if (typeof obj !== "object" || obj === null) return false;
	return (obj as Record<string, unknown>).jsonrpc === "2.0";
}

export function isNotification(
	msg: JsonRpcMessage,
): msg is JsonRpcNotification {
	return "method" in msg && !("id" in msg);
}

export function isRequest(msg: JsonRpcMessage): msg is JsonRpcRequest {
	return "method" in msg && "id" in msg;
}

export function isSuccessResponse(msg: JsonRpcMessage): msg is JsonRpcResponse {
	return "result" in msg && !("error" in msg);
}

export function isErrorResponse(
	msg: JsonRpcMessage,
): msg is JsonRpcErrorResponse {
	return "error" in msg;
}

export function parseMessage(input: string): ParseResult | ParseErrorResult {
	if (!input || typeof input !== "string") {
		return {
			valid: false,
			error: {
				code: JsonRpcErrorCode.ParseError,
				message: "Invalid JSON: empty or non-string input",
			},
		};
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(input);
	} catch {
		return {
			valid: false,
			error: {
				code: JsonRpcErrorCode.ParseError,
				message: "Invalid JSON: could not parse input",
			},
		};
	}

	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		return {
			valid: false,
			error: {
				code: JsonRpcErrorCode.InvalidRequest,
				message: "Invalid JSON-RPC: message must be an object",
			},
		};
	}

	const obj = parsed as Record<string, unknown>;

	if (!isValidJsonRpc(obj)) {
		return {
			valid: false,
			error: {
				code: JsonRpcErrorCode.InvalidRequest,
				message: "Invalid JSON-RPC: missing or invalid jsonrpc version",
			},
		};
	}

	if ("method" in obj) {
		if ("id" in obj) {
			if (typeof obj.method !== "string") {
				return {
					valid: false,
					error: {
						code: JsonRpcErrorCode.InvalidRequest,
						message: "Invalid JSON-RPC: method must be a string",
					},
				};
			}
			return { valid: true, type: "request", message: obj as JsonRpcRequest };
		} else {
			if (typeof obj.method !== "string") {
				return {
					valid: false,
					error: {
						code: JsonRpcErrorCode.InvalidRequest,
						message: "Invalid JSON-RPC: method must be a string",
					},
				};
			}
			return {
				valid: true,
				type: "notification",
				message: obj as JsonRpcNotification,
			};
		}
	} else if ("result" in obj || "error" in obj) {
		return {
			valid: true,
			type: "response",
			message: obj as JsonRpcResponse | JsonRpcErrorResponse,
		};
	}

	return {
		valid: false,
		error: {
			code: JsonRpcErrorCode.InvalidRequest,
			message: "Invalid JSON-RPC: unknown message type",
		},
	};
}

export function parseBatchMessage(
	input: string,
): ParseResult[] | ParseErrorResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse(input);
	} catch {
		return {
			valid: false,
			error: {
				code: JsonRpcErrorCode.ParseError,
				message: "Invalid JSON: could not parse input",
			},
		};
	}

	if (!Array.isArray(parsed)) {
		return {
			valid: false,
			error: {
				code: JsonRpcErrorCode.InvalidRequest,
				message: "Invalid JSON-RPC: batch must be an array",
			},
		};
	}

	const results: ParseResult[] = [];
	for (const item of parsed) {
		const itemStr = JSON.stringify(item);
		const result = parseMessage(itemStr);
		if (!result.valid) return result;
		results.push(result);
	}
	return results;
}

export function methodNotFound(
	method: string,
	id: string | number | null,
): JsonRpcErrorResponse {
	return createError(
		JsonRpcErrorCode.MethodNotFound,
		`Method not found: ${method}`,
		id,
	);
}

export function invalidParams(
	message: string,
	id: string | number | null,
): JsonRpcErrorResponse {
	return createError(
		JsonRpcErrorCode.InvalidParams,
		`Invalid params: ${message}`,
		id,
	);
}

export function internalError(
	message: string,
	id: string | number | null,
): JsonRpcErrorResponse {
	return createError(
		JsonRpcErrorCode.InternalError,
		`Internal error: ${message}`,
		id,
	);
}
