/**
 * Content Script
 * Main entry point - orchestrates all content modules
 *
 * Responsibilities:
 * - Manage global state (mode, recording status)
 * - Listen for configuration changes from Popup
 * - Listen for commands from iframe
 * - Coordinate all sub-modules
 * - Sync state with iframe
 */

import {
	MessageType,
	AgentMessage,
	AgentMode,
	createMessage,
} from "@shared/types";
import { createLogger } from "@shared/utils";
import { recorder, type RecordingData } from "./recorder";
import { operator } from "./operator";
import { overlay } from "./overlay";
import { iframeManager } from "./iframe-manager";
import { storage, type Recording } from "./storage";
import { configModule } from "./config";

const logger = createLogger("ContentScript");

/** Agent State */
interface AgentState {
	mode: AgentMode;
	isRecording: boolean;
	isPaused: boolean;
	sessionId: string | null;
	duration: number;
}

/** Current state */
let _state: AgentState = {
	mode: AgentMode.LEARN,
	isRecording: false,
	isPaused: false,
	sessionId: null,
	duration: 0,
};

let _durationTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize content script
 */
async function initialize(): Promise<void> {
	logger.info("Initializing content script");

	// Load configuration from storage
	try {
		await configModule.load();
		logger.info("Configuration loaded:", configModule.get());
	} catch (error) {
		logger.warn("Failed to load config, using defaults:", error);
	}

	// Initialize storage
	await storage.init();
	logger.info("Storage initialized");

	// Create overlay if enabled
	if (configModule.get().enableOverlay) {
		overlay.create();
	}

	// Set up callbacks
	recorder.onRecordingComplete(handleRecordingComplete);
	operator.onResult(handleOperationResult);
	iframeManager.onMessage(handleIframeMessage);

	// Listen for messages from background/Popup
	chrome.runtime.onMessage.addListener(handleExtensionMessage);

	// Listen for configuration changes
	chrome.storage.onChanged.addListener(handleConfigChange);

	// Listen for messages from iframe
	window.addEventListener("message", handleWindowMessage);

	logger.info("Content script initialized");
}

/**
 * Handle window postMessage from iframe
 */
function handleWindowMessage(event: MessageEvent): void {
	// Validate origin - only accept messages from our iframe
	const iframe = iframeManager.getElement();
	if (iframe && event.source !== iframe.contentWindow) {
		return;
	}

	const message = event.data as AgentMessage;
	if (!message || !message.type) {
		return;
	}

	logger.debug("Received postMessage from iframe:", message.type);
	handleCommand(message);
}

/**
 * Handle extension messages (from background/Popup)
 */
function handleExtensionMessage(
	message: { type: string; payload?: unknown },
	_sender: chrome.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
): boolean {
	logger.debug("Received extension message:", message.type);

	switch (message.type) {
		case "CONFIG_UPDATED": {
			// Handle config update from Popup
			const updates = message.payload as Record<string, unknown>;
			for (const [key, value] of Object.entries(updates)) {
				configModule.set(key as keyof typeof configModule.get, value as never);
			}
			// Apply changes
			applyConfigChanges(updates);
			sendResponse({ success: true });
			break;
		}

		case "GET_STATE": {
			sendResponse({
				type: "STATE_UPDATE",
				payload: getStatePayload(),
			});
			break;
		}

		case "RELOAD_IFRAME": {
			if (iframeManager.isCreated()) {
				const currentMode = _state.mode;
				iframeManager.destroy();
				iframeManager.create(currentMode);
			}
			sendResponse({ success: true });
			break;
		}

		case "CREATE_IFRAME": {
			if (!iframeManager.isCreated()) {
				iframeManager.create(_state.mode);
			}
			sendResponse({ success: true });
			break;
		}

		case "DESTROY_IFRAME": {
			if (iframeManager.isCreated()) {
				iframeManager.destroy();
			}
			sendResponse({ success: true });
			break;
		}

		default:
			logger.warn("Unknown message type:", message.type);
	}

	return true;
}

/**
 * Handle configuration changes from chrome.storage
 */
function handleConfigChange(
	changes: Record<string, chrome.storage.StorageChange>,
	areaName: string,
): void {
	if (areaName !== "local") {
		return;
	}

	logger.info("Configuration changed:", changes);

	// Update config module
	for (const [key, change] of Object.entries(changes)) {
		if (change.newValue !== undefined) {
			configModule.set(
				key as keyof typeof configModule.get,
				change.newValue as never,
			);
		}
	}

	// Apply changes
	applyConfigChanges(
		Object.fromEntries(
			Object.entries(changes).map(([k, v]) => [k, v.newValue]),
		),
	);

	// Notify iframe
	iframeManager.sendMessage({
		type: "CONFIG_UPDATED",
		payload: changes,
	});
}

/**
 * Apply configuration changes
 */
function applyConfigChanges(changes: Record<string, unknown>): void {
	if (changes.enableOverlay !== undefined) {
		if (changes.enableOverlay) {
			if (!overlay.isCreated()) {
				overlay.create();
			}
		} else {
			if (overlay.isCreated()) {
				overlay.destroy();
			}
		}
	}
}

/**
 * Handle iframe messages (postMessage)
 */
function handleIframeMessage(message: AgentMessage): void {
	logger.debug("Received message from iframe:", message.type);
	handleCommand(message);
}

/**
 * Handle command from iframe or extension
 */
function handleCommand(message: AgentMessage): void {
	const { type, payload } = message;

	switch (type) {
		// Mode commands
		case "SET_MODE":
			setMode((payload as { mode: AgentMode }).mode);
			break;

		case "START_LEARN_MODE":
			startMode(AgentMode.LEARN);
			break;

		case "START_GUIDE_MODE":
			startMode(AgentMode.GUIDE);
			break;

		case "START_ACTIVE_MODE":
			startMode(AgentMode.ACTIVE);
			break;

		case "STOP_LEARN_MODE":
		case "STOP_GUIDE_MODE":
		case "STOP_ACTIVE_MODE":
			stopMode();
			break;

		// Recording commands
		case "START_RECORDING":
			startRecording();
			break;

		case "STOP_RECORDING":
			stopRecording();
			break;

		case "PAUSE_RECORDING":
			pauseRecording();
			break;

		case "RESUME_RECORDING":
			resumeRecording();
			break;

		// Operation commands
		case "EXECUTE_OPERATION": {
			const opPayload = payload as {
				action: "click" | "input" | "submit" | "navigate";
				selector: string;
				fallbackSelector?: string;
				value?: string;
			};
			operator.execute({
				action: opPayload.action,
				selector: opPayload.selector,
				fallbackSelector: opPayload.fallbackSelector,
				value: opPayload.value,
			});
			break;
		}

		// State queries
		case "GET_STATE":
			iframeManager.sendMessage({
				type: "STATE_UPDATE",
				payload: getStatePayload(),
			});
			break;

		default:
			logger.warn("Unknown command:", type);
	}
}

/**
 * Set agent mode without starting recording
 */
function setMode(mode: AgentMode): void {
	logger.info("Setting mode:", mode);
	_state.mode = mode;

	// Create iframe if not exists
	if (!iframeManager.isCreated()) {
		iframeManager.create(mode);
	}

	broadcastState();
}

/**
 * Start a specific mode with recording
 */
function startMode(mode: AgentMode): void {
	logger.info("Starting mode:", mode);
	_state.mode = mode;

	// Create iframe if not exists
	if (!iframeManager.isCreated()) {
		iframeManager.create(mode);
	}

	// Start recording if enabled
	if (configModule.get().enableRecording) {
		startRecording();
	}

	// Update overlay
	overlay.updateState(_state.isRecording ? "recording" : "idle");
	broadcastState();
}

/**
 * Stop current mode
 */
function stopMode(): void {
	logger.info("Stopping mode");
	if (_state.isRecording) {
		stopRecording();
	}
	overlay.updateState("idle");
	broadcastState();
}

/**
 * Start recording
 */
function startRecording(): void {
	if (_state.isRecording) {
		logger.warn("Already recording");
		return;
	}

	if (!configModule.get().enableRecording) {
		logger.warn("Recording is disabled");
		return;
	}

	logger.info("Starting recording");
	recorder.start();
	_state.isRecording = true;
	_state.isPaused = false;
	_state.sessionId = recorder.getSessionId();
	_state.duration = 0;

	overlay.updateState("recording");
	startDurationTimer();
	broadcastState();
}

/**
 * Stop recording
 */
function stopRecording(): void {
	if (!_state.isRecording) {
		logger.warn("Not recording");
		return;
	}

	logger.info("Stopping recording");
	recorder.stop();
	_state.isRecording = false;
	_state.isPaused = false;

	overlay.updateState("idle");
	stopDurationTimer();
	broadcastState();
}

/**
 * Pause recording
 */
function pauseRecording(): void {
	if (!_state.isRecording || _state.isPaused) {
		logger.warn("Cannot pause: not recording or already paused");
		return;
	}

	logger.info("Pausing recording");
	recorder.pause();
	_state.isPaused = true;

	overlay.updateState("paused");
	broadcastState();
}

/**
 * Resume recording
 */
function resumeRecording(): void {
	if (!_state.isRecording || !_state.isPaused) {
		logger.warn("Cannot resume: not recording or not paused");
		return;
	}

	logger.info("Resuming recording");
	recorder.resume();
	_state.isPaused = false;

	overlay.updateState("recording");
	broadcastState();
}

/**
 * Handle recording complete
 */
async function handleRecordingComplete(data: RecordingData): Promise<void> {
	logger.info("Recording complete, session:", data.sessionId);

	const recording: Recording = {
		id: crypto.randomUUID(),
		sessionId: data.sessionId,
		events: data.events,
		startTime: data.startTime,
		endTime: data.endTime,
		duration: data.endTime - data.startTime,
		synced: false,
		createdAt: Date.now(),
	};

	try {
		await storage.saveRecording(recording);
		logger.info("Recording saved:", recording.id);
	} catch (error) {
		logger.error("Failed to save recording:", error);
	}
}

/**
 * Handle operation result
 */
function handleOperationResult(result: {
	success: boolean;
	error?: string;
}): void {
	logger.debug("Operation result:", result);
	iframeManager.sendMessage({
		type: result.success ? "OPERATION_COMPLETED" : "OPERATION_FAILED",
		payload: result,
	});
}

/**
 * Get current state payload for broadcasting
 */
function getStatePayload(): AgentState & {
	config: ReturnType<typeof configModule.get>;
} {
	return {
		..._state,
		config: configModule.get(),
	};
}

/**
 * Broadcast current state to iframe
 */
function broadcastState(): void {
	if (iframeManager.isCreated()) {
		iframeManager.sendMessage({
			type: "STATE_UPDATE",
			payload: getStatePayload(),
		});
	}
}

/**
 * Start duration timer
 */
function startDurationTimer(): void {
	stopDurationTimer();
	const startTime = Date.now();
	_durationTimer = setInterval(() => {
		_state.duration = Math.floor((Date.now() - startTime) / 1000);
		overlay.updateDuration(_state.duration);
	}, 1000);
}

/**
 * Stop duration timer
 */
function stopDurationTimer(): void {
	if (_durationTimer) {
		clearInterval(_durationTimer);
		_durationTimer = null;
	}
}

// Initialize on load
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => initialize());
} else {
	initialize();
}

// Export for debugging
declare global {
	interface Window {
		neoAgent?: {
			recorder: typeof recorder;
			operator: typeof operator;
			overlay: typeof overlay;
			iframeManager: typeof iframeManager;
			storage: typeof storage;
			configModule: typeof configModule;
			getState: () => AgentState;
			startRecording: () => void;
			stopRecording: () => void;
			pauseRecording: () => void;
			resumeRecording: () => void;
			setMode: (mode: AgentMode) => void;
			startLearnMode: () => void;
			startGuideMode: () => void;
			startActiveMode: () => void;
			stopMode: () => void;
		};
	}
}

window.neoAgent = {
	recorder,
	operator,
	overlay,
	iframeManager,
	storage,
	configModule,
	getState: () => ({ ..._state }),
	startRecording,
	stopRecording,
	pauseRecording,
	resumeRecording,
	setMode: (mode) => setMode(mode),
	startLearnMode: () => startMode(AgentMode.LEARN),
	startGuideMode: () => startMode(AgentMode.GUIDE),
	startActiveMode: () => startMode(AgentMode.ACTIVE),
	stopMode,
};
