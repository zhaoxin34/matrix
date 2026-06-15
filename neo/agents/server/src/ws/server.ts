/**
 * WebSocket Server (Placeholder)
 */

import type { ServerConfig } from "../config.js";
import { logger } from "../utils/logger.js";

export async function startServer(config: ServerConfig): Promise<void> {
	logger.info(
		`[M6 Placeholder] Would start server on ${config.host}:${config.port}`,
	);
	throw new Error("WebSocket server not implemented yet (see M6)");
}

export async function stopServer(): Promise<void> {
	throw new Error("WebSocket server not implemented yet (see M6)");
}
