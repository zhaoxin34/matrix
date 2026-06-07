/**
 * Background Service Worker
 * Handles task scheduling, message routing, and offline cache management
 */

import {
	MessageType,
	AgentMessage,
	AgentConfig,
	DEFAULT_CONFIG,
	createMessage,
} from "@shared/types";
import { createLogger } from "@shared/utils";

const logger = createLogger("Background");

/** Configuration storage key */
const CONFIG_STORAGE_KEY = "neo-agent-config";

/** Offline message queue storage key */
const QUEUE_STORAGE_KEY = "neo-agent-message-queue";

/** Message queue item */
interface QueuedMessage {
	id: string;
	message: AgentMessage;
	tabId: number;
	timestamp: number;
}

/** Current configuration */
let config: AgentConfig = { ...DEFAULT_CONFIG };

/** Offline message queue */
const _messageQueue: QueuedMessage[] = [];

// Initialize
initialize();

/**
 * Initialize background service worker
 */
async function initialize(): Promise<void> {
	logger.info("Initializing background service worker");

	// Load configuration
	await loadConfig();

	// Load offline queue
	await loadMessageQueue();

	// Flush any queued messages
	await flushMessageQueue();

	logger.info("Background service worker initialized");
}

/**
 * Load configuration from storage
 */
async function loadConfig(): Promise<void> {
	return new Promise((resolve) => {
		chrome.storage.local.get(CONFIG_STORAGE_KEY, (result) => {
			if (chrome.runtime.lastError) {
				logger.warn("Failed to load config:", chrome.runtime.lastError);
				config = { ...DEFAULT_CONFIG };
				resolve();
				return;
			}

			const stored = result[CONFIG_STORAGE_KEY];
			if (stored) {
				config = { ...DEFAULT_CONFIG, ...stored };
				logger.info("Config loaded from storage");
			} else {
				config = { ...DEFAULT_CONFIG };
				logger.info("Using default config");
			}
			resolve();
		});
	});
}

/**
 * Save configuration to storage
 */
async function saveConfig(newConfig: AgentConfig): Promise<void> {
	return new Promise((resolve, reject) => {
		const data: Record<string, AgentConfig> = {};
		data[CONFIG_STORAGE_KEY] = newConfig;

		chrome.storage.local.set(data, () => {
			if (chrome.runtime.lastError) {
				logger.error("Failed to save config:", chrome.runtime.lastError);
				reject(new Error(chrome.runtime.lastError.message));
				return;
			}

			config = newConfig;
			logger.info("Config saved to storage");
			resolve();
		});
	});
}

/**
 * Load message queue from storage
 */
async function loadMessageQueue(): Promise<void> {
	return new Promise((resolve) => {
		chrome.storage.local.get(QUEUE_STORAGE_KEY, (result) => {
			if (chrome.runtime.lastError) {
				logger.warn("Failed to load message queue:", chrome.runtime.lastError);
				resolve();
				return;
			}

			const stored = result[QUEUE_STORAGE_KEY];
			if (stored && Array.isArray(stored)) {
				_messageQueue.push(...stored);
				logger.info(`Loaded ${stored.length} queued messages`);
			}
			resolve();
		});
	});
}

/**
 * Save message queue to storage
 */
async function saveMessageQueue(): Promise<void> {
	return new Promise((resolve, reject) => {
		const data: Record<string, QueuedMessage[]> = {};
		data[QUEUE_STORAGE_KEY] = _messageQueue;

		chrome.storage.local.set(data, () => {
			if (chrome.runtime.lastError) {
				logger.error("Failed to save message queue:", chrome.runtime.lastError);
				reject(new Error(chrome.runtime.lastError.message));
				return;
			}
			resolve();
		});
	});
}

/**
 * Add message to offline queue
 */
async function queueMessage(
	message: AgentMessage,
	tabId: number,
): Promise<void> {
	const queuedMessage: QueuedMessage = {
		id: crypto.randomUUID(),
		message,
		tabId,
		timestamp: Date.now(),
	};

	_messageQueue.push(queuedMessage);
	await saveMessageQueue();
	logger.info("Message queued for later delivery");
}

/**
 * Flush message queue
 */
async function flushMessageQueue(): Promise<void> {
	if (_messageQueue.length === 0) {
		return;
	}

	logger.info(`Flushing ${_messageQueue.length} queued messages`);

	const failedMessages: QueuedMessage[] = [];

	for (const queued of _messageQueue) {
		try {
			await chrome.tabs.sendMessage(queued.tabId, queued.message);
			logger.debug("Queued message delivered:", queued.id);
		} catch (error) {
			logger.warn("Failed to deliver queued message:", queued.id, error);
			failedMessages.push(queued);
		}
	}

	// Update queue with only failed messages
	_messageQueue.length = 0;
	_messageQueue.push(...failedMessages);
	await saveMessageQueue();

	logger.info(`Queue flush complete. ${failedMessages.length} messages failed`);
}

/**
 * Handle messages from content scripts and extension UI
 */
chrome.runtime.onMessage.addListener(
	(message: AgentMessage, sender, sendResponse) => {
		logger.debug("Received message:", message.type, sender.tab?.id);

		handleMessage(message, sender)
			.then((response) => sendResponse(response))
			.catch((error) => {
				logger.error("Error handling message:", error);
				sendResponse(
					createMessage(MessageType.STATE_UPDATE, { error: error.message }),
				);
			});

		// Return true to indicate async response
		return true;
	},
);

/**
 * Handle individual message types
 */
async function handleMessage(
	message: AgentMessage,
	sender: chrome.runtime.MessageSender,
): Promise<AgentMessage> {
	const tabId = sender.tab?.id;

	switch (message.type) {
		case MessageType.GET_STATE:
			return createMessage(MessageType.STATE_UPDATE, {
				config,
				tabId,
			});

		case MessageType.START_RECORDING:
		case MessageType.STOP_RECORDING:
		case MessageType.PAUSE_RECORDING:
		case MessageType.RESUME_RECORDING:
		case MessageType.START_LEARN_MODE:
		case MessageType.STOP_LEARN_MODE:
		case MessageType.START_GUIDE_MODE:
		case MessageType.STOP_GUIDE_MODE:
		case MessageType.START_ACTIVE_MODE:
		case MessageType.STOP_ACTIVE_MODE:
			// Forward recording/control messages to content script
			if (tabId) {
				return forwardToContentScript(message, tabId);
			}
			return createMessage(MessageType.STATE_UPDATE, {
				error: "No tab ID available",
			});

		case MessageType.IFRAME_MESSAGE:
			return handleIframeMessage(message, sender);

		default:
			logger.warn("Unknown message type:", message.type);
			return createMessage(MessageType.STATE_UPDATE, {
				error: "Unknown message type",
			});
	}
}

/**
 * Forward message to content script
 */
async function forwardToContentScript(
	message: AgentMessage,
	tabId: number,
): Promise<AgentMessage> {
	try {
		const response = await chrome.tabs.sendMessage(tabId, message);
		return response;
	} catch (error) {
		logger.error("Failed to forward message to content script:", error);

		// Queue message for later delivery
		await queueMessage(message, tabId);

		return createMessage(MessageType.STATE_UPDATE, {
			error: "Content script not available, message queued",
			queued: true,
		});
	}
}

/**
 * Handle iframe messages - forward to appropriate content script
 */
async function handleIframeMessage(
	message: AgentMessage,
	sender: chrome.runtime.MessageSender,
): Promise<AgentMessage> {
	const tabId = sender.tab?.id;
	if (!tabId) {
		return createMessage(MessageType.STATE_UPDATE, { error: "No tab ID" });
	}

	return forwardToContentScript(message, tabId);
}

/**
 * Handle extension installation or update
 */
chrome.runtime.onInstalled.addListener((details) => {
	logger.info("Extension installed/updated:", details.reason);

	if (details.reason === "install") {
		// Initialize default configuration
		saveConfig(DEFAULT_CONFIG);
		logger.info("Default configuration initialized");
	}
});

/**
 * Handle startup
 */
chrome.runtime.onStartup.addListener(() => {
	logger.info("Extension startup");
	// Re-initialize on startup
	initialize();
});

/**
 * Handle tab updates - try to deliver queued messages
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
	if (changeInfo.status === "complete" && _messageQueue.length > 0) {
		logger.info("Tab loaded, attempting to flush queued messages");
		await flushMessageQueue();
	}
});

logger.info("Background service worker initialized");
