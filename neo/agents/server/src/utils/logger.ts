/**
 * Simple logger utility with log levels
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

const LOG_LEVEL_NAMES = ["DEBUG", "INFO", "WARN", "ERROR"] as const;

export interface LoggerOptions {
	level?: LogLevel;
	prefix?: string;
	timestamp?: boolean;
}

export class Logger {
	private level: LogLevel;
	private prefix: string;
	private timestamp: boolean;

	constructor(options: LoggerOptions = {}) {
		this.level = options.level ?? LogLevel.INFO;
		this.prefix = options.prefix ?? "";
		this.timestamp = options.timestamp ?? true;
	}

	setLevel(level: LogLevel): void {
		this.level = level;
	}

	debug(message: string, ...args: unknown[]): void {
		this.log(LogLevel.DEBUG, message, ...args);
	}

	info(message: string, ...args: unknown[]): void {
		this.log(LogLevel.INFO, message, ...args);
	}

	warn(message: string, ...args: unknown[]): void {
		this.log(LogLevel.WARN, message, ...args);
	}

	error(message: string, ...args: unknown[]): void {
		this.log(LogLevel.ERROR, message, ...args);
	}

	private log(level: LogLevel, message: string, ...args: unknown[]): void {
		if (level < this.level) return;

		const parts: string[] = [];
		if (this.timestamp) parts.push(this.formatTimestamp());
		if (this.prefix) parts.push(`[${this.prefix}]`);
		parts.push(`[${LOG_LEVEL_NAMES[level]}]`);
		parts.push(message);

		const formatted = parts.join(" ");
		if (level >= LogLevel.ERROR) console.error(formatted, ...args);
		else if (level >= LogLevel.WARN) console.warn(formatted, ...args);
		else console.log(formatted, ...args);
	}

	private formatTimestamp(): string {
		const now = new Date();
		const pad = (n: number) => n.toString().padStart(2, "0");
		return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
	}
}

export const logger = new Logger({ level: LogLevel.INFO, prefix: "pi-agent" });

export function createLogger(prefix: string, level?: LogLevel): Logger {
	return new Logger({ prefix, level: level ?? LogLevel.INFO });
}
