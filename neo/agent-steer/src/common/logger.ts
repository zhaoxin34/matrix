/**
 * 日志工具 - 用于调试 Chrome Extension
 *
 * 使用方式：
 * 1. 在 Chrome 中打开 chrome://extensions/
 * 2. 找到 "Neo Agent" 扩展，点击 "Service Worker" 或 Content Script 的 "链接"
 * 3. 查看 Console 中的日志输出
 *
 * 日志级别：
 * - DEBUG: 详细的调试信息
 * - INFO: 一般信息
 * - WARN: 警告
 * - ERROR: 错误
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

const LOG_PREFIX = "[NeoAgent]";

function formatMessage(
	level: string,
	module: string,
	message: string,
	data?: unknown,
): string {
	const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
	const prefix = `${LOG_PREFIX}[${timestamp}][${level}][${module}]`;
	if (data !== undefined) {
		return `${prefix} ${message} %o`;
	}
	return `${prefix} ${message}`;
}

export const logger = {
	debug(module: string, message: string, data?: unknown): void {
		console.debug(formatMessage("DEBUG", module, message), data ?? "");
	},

	info(module: string, message: string, data?: unknown): void {
		console.log(formatMessage("INFO", module, message), data ?? "");
	},

	warn(module: string, message: string, data?: unknown): void {
		console.warn(formatMessage("WARN", module, message), data ?? "");
	},

	error(module: string, message: string, data?: unknown): void {
		console.error(formatMessage("ERROR", module, message), data ?? "");
	},

	// 便捷方法 - 专门用于录制模块
	recording: {
		debug(message: string, data?: unknown) {
			logger.debug("Recording", message, data);
		},
		info(message: string, data?: unknown) {
			logger.info("Recording", message, data);
		},
		warn(message: string, data?: unknown) {
			logger.warn("Recording", message, data);
		},
		error(message: string, data?: unknown) {
			logger.error("Recording", message, data);
		},
	},

	// 便捷方法 - 用于 UI 模块
	ui: {
		debug(message: string, data?: unknown) {
			logger.debug("UI", message, data);
		},
		info(message: string, data?: unknown) {
			logger.info("UI", message, data);
		},
		warn(message: string, data?: unknown) {
			logger.warn("UI", message, data);
		},
		error(message: string, data?: unknown) {
			logger.error("UI", message, data);
		},
	},

	// 便捷方法 - 用于 Service Worker 模块
	sw: {
		debug(message: string, data?: unknown) {
			logger.debug("SW", message, data);
		},
		info(message: string, data?: unknown) {
			logger.info("SW", message, data);
		},
		warn(message: string, data?: unknown) {
			logger.warn("SW", message, data);
		},
		error(message: string, data?: unknown) {
			logger.error("SW", message, data);
		},
	},

	// 便捷方法 - 用于 Content Script 模块
	cs: {
		debug(message: string, data?: unknown) {
			logger.debug("CS", message, data);
		},
		info(message: string, data?: unknown) {
			logger.info("CS", message, data);
		},
		warn(message: string, data?: unknown) {
			logger.warn("CS", message, data);
		},
		error(message: string, data?: unknown) {
			logger.error("CS", message, data);
		},
	},
};
