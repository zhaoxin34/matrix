/**
 * JSON-RPC API Handler
 *
 * Handles session.* methods and routes events back to WebSocket connections.
 */

import { v4 as uuidv4 } from "uuid";
import {
	parseMessage,
	parseBatchMessage,
	createResponse,
	createError,
	isRequest,
	isNotification,
	type JsonRpcRequest,
	type JsonRpcResponse,
	type JsonRpcErrorResponse,
	JsonRpcErrorCode,
} from "../protocol/jsonrpc.js";
import { type IAgentSession, createMockAgentSession } from "../worker/agent.js";
import type { WsConnection } from "../ws/server.js";
import { createLogger } from "../utils/logger.js";

// ========== Types ==========

export interface ApiContext {
	connection: WsConnection;
	session: IAgentSession;
	sessionId: string;
}

export type ApiHandler = (
	request: JsonRpcRequest,
	context: ApiContext,
) => Promise<JsonRpcResponse | JsonRpcErrorResponse | void>;

export type EventHandler = (connection: WsConnection, event: unknown) => void;

// ========== Session Manager ==========

export class SessionManager {
	private sessions: Map<string, IAgentSession> = new Map();
	private connectionSessions: Map<string, string> = new Map(); // connectionId -> sessionId
	private log = createLogger("SessionManager");

	/**
	 * Create a new session for a connection
	 */
	createSession(
		connection: WsConnection,
		options: {
			cwd?: string;
			modelId?: string;
			thinkingLevel?: string;
		} = {},
	): { sessionId: string; session: IAgentSession } {
		const sessionId = uuidv4();

		const session = createMockAgentSession({
			sessionId,
			cwd: options.cwd ?? "/tmp",
			thinkingLevel: (options.thinkingLevel as any) ?? "medium",
		});

		this.sessions.set(sessionId, session);
		this.connectionSessions.set(connection.id, sessionId);

		// Subscribe to session events and forward to connection
		session.subscribe((event) => {
			this.sendEvent(connection, event);
		});

		this.log.debug(
			`Session created: ${sessionId} for connection ${connection.id}`,
		);

		return { sessionId, session };
	}

	/**
	 * Get session by ID
	 */
	getSession(sessionId: string): IAgentSession | undefined {
		return this.sessions.get(sessionId);
	}

	/**
	 * Get session for a connection
	 */
	getConnectionSession(
		connection: WsConnection,
	): { sessionId: string; session: IAgentSession } | undefined {
		const sessionId = this.connectionSessions.get(connection.id);
		if (!sessionId) return undefined;

		const session = this.sessions.get(sessionId);
		if (!session) return undefined;

		return { sessionId, session };
	}

	/**
	 * Destroy a session
	 */
	destroySession(sessionId: string): void {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.dispose();
			this.sessions.delete(sessionId);
		}

		// Remove from connection map
		for (const [connId, sid] of this.connectionSessions) {
			if (sid === sessionId) {
				this.connectionSessions.delete(connId);
				break;
			}
		}

		this.log.debug(`Session destroyed: ${sessionId}`);
	}

	/**
	 * Send event to WebSocket connection
	 */
	private sendEvent(connection: WsConnection, event: unknown): void {
		connection.send({
			jsonrpc: "2.0",
			method: "agent.event",
			params: event,
		});
	}
}

// ========== API Handlers ==========

async function handleSessionCreate(
	request: JsonRpcRequest,
	context: ApiContext,
): Promise<JsonRpcResponse> {
	const { sessionId } = context;

	return createResponse(request.id, {
		sessionId,
		status: "created",
	});
}

async function handleSessionSend(
	request: JsonRpcRequest,
	context: ApiContext,
): Promise<JsonRpcResponse | JsonRpcErrorResponse> {
	const params = request.params as
		| { prompt?: string; images?: unknown[] }
		| undefined;

	if (!params?.prompt) {
		return createError(
			JsonRpcErrorCode.InvalidParams,
			"Missing required parameter: prompt",
			request.id,
		);
	}

	const { session, sessionId } = context;

	if (session.isStreaming) {
		return createError(-32002, "Session is currently streaming", request.id);
	}

	try {
		// Send prompt (don't await - events will be streamed)
		session.prompt(params.prompt).catch((err) => {
			context.connection.send(
				createError(JsonRpcErrorCode.InternalError, String(err), null),
			);
		});

		return createResponse(request.id, {
			status: "processing",
			sessionId,
		});
	} catch (err) {
		return createError(JsonRpcErrorCode.InternalError, String(err), request.id);
	}
}

async function handleSessionSteer(
	request: JsonRpcRequest,
	context: ApiContext,
): Promise<JsonRpcResponse | JsonRpcErrorResponse> {
	const params = request.params as { text?: string } | undefined;

	if (!params?.text) {
		return createError(
			JsonRpcErrorCode.InvalidParams,
			"Missing required parameter: text",
			request.id,
		);
	}

	const { session } = context;

	if (!session.isStreaming) {
		return createError(
			-32002,
			"Session is not currently streaming",
			request.id,
		);
	}

	try {
		await session.steer(params.text);
		return createResponse(request.id, { status: "steered" });
	} catch (err) {
		return createError(JsonRpcErrorCode.InternalError, String(err), request.id);
	}
}

async function handleSessionFollowUp(
	request: JsonRpcRequest,
	context: ApiContext,
): Promise<JsonRpcResponse | JsonRpcErrorResponse> {
	const params = request.params as { text?: string } | undefined;

	if (!params?.text) {
		return createError(
			JsonRpcErrorCode.InvalidParams,
			"Missing required parameter: text",
			request.id,
		);
	}

	const { session } = context;

	try {
		await session.followUp(params.text);
		return createResponse(request.id, { status: "queued" });
	} catch (err) {
		return createError(JsonRpcErrorCode.InternalError, String(err), request.id);
	}
}

async function handleSessionAbort(
	request: JsonRpcRequest,
	context: ApiContext,
): Promise<JsonRpcResponse | JsonRpcErrorResponse> {
	const { session } = context;

	try {
		const aborted = await session.abort();
		return createResponse(request.id, { aborted });
	} catch (err) {
		return createError(JsonRpcErrorCode.InternalError, String(err), request.id);
	}
}

async function handleSessionInfo(
	request: JsonRpcRequest,
	context: ApiContext,
): Promise<JsonRpcResponse> {
	const { session, sessionId } = context;

	return createResponse(request.id, {
		sessionId,
		isStreaming: session.isStreaming,
		messageCount: session.messages.length,
		cwd: session.cwd,
		modelId: session.model?.id ?? null,
		thinkingLevel: session.thinkingLevel,
	});
}

async function handleSessionDestroy(
	request: JsonRpcRequest,
	context: ApiContext,
): Promise<JsonRpcResponse> {
	sessionManager.destroySession(context.sessionId);
	return createResponse(request.id, { status: "destroyed" });
}

// ========== Method Dispatcher ==========

const methodHandlers: Record<
	string,
	(
		request: JsonRpcRequest,
		context: ApiContext,
	) => Promise<JsonRpcResponse | JsonRpcErrorResponse>
> = {
	"session.create": handleSessionCreate,
	"session.send": handleSessionSend,
	"session.steer": handleSessionSteer,
	"session.followUp": handleSessionFollowUp,
	"session.abort": handleSessionAbort,
	"session.info": handleSessionInfo,
	"session.destroy": handleSessionDestroy,
};

// Singleton session manager
export const sessionManager = new SessionManager();

// ========== Request Handler ==========

export async function handleRequest(
	data: string,
	connection: WsConnection,
): Promise<(JsonRpcResponse | JsonRpcErrorResponse | void)[]> {
	const results: (JsonRpcResponse | JsonRpcErrorResponse | void)[] = [];

	// Try to parse as batch first
	const batchResult = parseBatchMessage(data);

	// If batch parsing failed, it returns ParseErrorResult
	if (!Array.isArray(batchResult) && "error" in batchResult) {
		// Parse as single message
		const parseResult = parseMessage(data);

		if (!parseResult.valid) {
			return [
				createError(
					JsonRpcErrorCode.ParseError,
					parseResult.error.message,
					null,
				),
			];
		}

		return handleParsedMessage(parseResult.message, connection);
	}

	// Handle batch
	for (const item of batchResult as any[]) {
		if (!item.valid) {
			results.push(createError(item.error.code, item.error.message, null));
			continue;
		}

		const batchResults = await handleParsedMessage(item.message, connection);
		results.push(...batchResults);
	}

	return results;
}

async function handleParsedMessage(
	message: any,
	connection: WsConnection,
): Promise<(JsonRpcResponse | JsonRpcErrorResponse | void)[]> {
	const results: (JsonRpcResponse | JsonRpcErrorResponse | void)[] = [];

	// Handle notifications (no response needed)
	if (isNotification(message)) {
		// TODO: Handle notifications if needed
		return results;
	}

	// Handle requests
	if (isRequest(message)) {
		const request = message as JsonRpcRequest;

		// Get or create session for this connection
		let context: ApiContext;

		const existing = sessionManager.getConnectionSession(connection);
		if (existing) {
			context = {
				connection,
				session: existing.session,
				sessionId: existing.sessionId,
			};
		} else {
			// Auto-create session for session.* methods
			if (request.method.startsWith("session.")) {
				const { sessionId, session } = sessionManager.createSession(connection);
				context = { connection, session, sessionId };
			} else {
				results.push(createError(-32001, "No session found", request.id));
				return results;
			}
		}

		// Find handler
		const handler = methodHandlers[request.method];

		if (!handler) {
			results.push(
				createError(
					JsonRpcErrorCode.MethodNotFound,
					`Method not found: ${request.method}`,
					request.id,
				),
			);
			return results;
		}

		try {
			const result = await handler(request, context);
			results.push(result);
		} catch (err) {
			results.push(
				createError(JsonRpcErrorCode.InternalError, String(err), request.id),
			);
		}
	}

	return results;
}
