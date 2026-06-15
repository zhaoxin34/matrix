/**
 * Pi Agent Server - Entry Point
 */

import { loadConfigFromEnv, getConfig } from "./config.js";
import { logger, LogLevel } from "./utils/logger.js";

async function main() {
	loadConfigFromEnv();
	const config = getConfig();

	const logLevelMap: Record<string, LogLevel> = {
		DEBUG: LogLevel.DEBUG,
		INFO: LogLevel.INFO,
		WARN: LogLevel.WARN,
		ERROR: LogLevel.ERROR,
	};
	logger.setLevel(logLevelMap[config.logLevel] ?? LogLevel.INFO);

	logger.info("Starting Pi Agent Server...");

	try {
		const { startServer } = await import("./ws/server.js");
		await startServer(config);
	} catch (error) {
		logger.error("Failed to start server:", error);
		process.exit(1);
	}
}

process.on("uncaughtException", (error) => {
	logger.error("Uncaught exception:", error);
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	logger.error("Unhandled rejection:", reason);
	process.exit(1);
});

main();
