/**
 * Configuration Management Module
 * Handles persistent storage using chrome.storage.local
 */

import { AgentConfig, DEFAULT_CONFIG, AgentMode } from "@shared/types";
import { createLogger } from "@shared/utils";

const logger = createLogger("Config");

/** Storage keys */
const STORAGE_KEY = "neo-agent-config";

/** Configuration module interface */
export interface ConfigModule {
	load: () => Promise<AgentConfig>;
	save: (config: AgentConfig) => Promise<void>;
	get: () => AgentConfig;
	update: (partial: Partial<AgentConfig>) => Promise<AgentConfig>;
	reset: () => Promise<void>;
}

/** Create configuration module */
export function createConfig(): ConfigModule {
	// In-memory cache
	let _cachedConfig: AgentConfig = { ...DEFAULT_CONFIG };

	/** Load configuration from storage */
	async function load(): Promise<AgentConfig> {
		return new Promise((resolve, reject) => {
			chrome.storage.local.get(STORAGE_KEY, (result) => {
				if (chrome.runtime.lastError) {
					logger.error("Failed to load config:", chrome.runtime.lastError);
					// Fall back to default config
					_cachedConfig = { ...DEFAULT_CONFIG };
					resolve(_cachedConfig);
					return;
				}

				const stored = result[STORAGE_KEY];
				if (stored) {
					// Merge with defaults to ensure all fields exist
					_cachedConfig = {
						...DEFAULT_CONFIG,
						...stored,
					};
					logger.info("Config loaded from storage:", _cachedConfig);
				} else {
					_cachedConfig = { ...DEFAULT_CONFIG };
					logger.info("Using default config");
				}

				resolve(_cachedConfig);
			});
		});
	}

	/** Save configuration to storage */
	async function save(config: AgentConfig): Promise<void> {
		return new Promise((resolve, reject) => {
			const data: Record<string, AgentConfig> = {};
			data[STORAGE_KEY] = config;

			chrome.storage.local.set(data, () => {
				if (chrome.runtime.lastError) {
					logger.error("Failed to save config:", chrome.runtime.lastError);
					reject(new Error(chrome.runtime.lastError.message));
					return;
				}

				_cachedConfig = { ...config };
				logger.info("Config saved to storage");
				resolve();
			});
		});
	}

	/** Get current configuration from cache */
	function get(): AgentConfig {
		return _cachedConfig;
	}

	/** Update configuration partially */
	async function update(partial: Partial<AgentConfig>): Promise<AgentConfig> {
		const newConfig = {
			..._cachedConfig,
			...partial,
		};

		await save(newConfig);
		return newConfig;
	}

	/** Reset configuration to defaults */
	async function reset(): Promise<void> {
		await save(DEFAULT_CONFIG);
		_cachedConfig = { ...DEFAULT_CONFIG };
		logger.info("Config reset to defaults");
	}

	// Public API
	return {
		load,
		save,
		get,
		update,
		reset,
	};
}

/** Default config instance */
export const configModule = createConfig();
