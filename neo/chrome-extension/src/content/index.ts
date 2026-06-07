/**
 * Content Script
 * Main entry point - orchestrates all content modules
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

/** State */
let _config = {
	mode: AgentMode.LEARN,
	frontendUrl: "http://localhost:3300",
	backendUrl: "http://localhost:8000",
	enableRecording: true,
	enableOverlay: true,
};
let _agentMode: AgentMode = AgentMode.LEARN;
let _recordingStartTime = 0;
let _durationTimer: ReturnType<typeof setInterval> | null = null;

/** Initialize all modules */
async function initialize(): Promise<void> {
	logger.info("Initializing content script");

	// Load configuration from storage
	try {
		_config = await configModule.load();
		logger.info("Configuration loaded");
	} catch (error) {
		logger.warn("Failed to load config, using defaults:", error);
	}

	// Initialize storage
	await storage.init();
	logger.info("Storage initialized");

	// Create overlay if enabled
	if (_config.enableOverlay) {
		overlay.create();
	}

	// Set up recorder completion callback
	recorder.onRecordingComplete(handleRecordingComplete);

	// Set up operator result callback
	operator.onResult(handleOperationResult);

	// Set up iframe message handler
	iframeManager.onMessage(handleIframeMessage);

	// Listen for messages from background
	chrome.runtime.onMessage.addListener(handleBackgroundMessage);

	logger.info("Content script initialized");
}

/** Handle recording complete */
async function handleRecordingComplete(data: RecordingData): Promise<void> {
	logger.info("Recording complete, session:", data.sessionId);

	// Create recording object
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

	// Save to IndexedDB
	try {
		await storage.saveRecording(recording);
		logger.info("Recording saved to storage:", recording.id);
	} catch (error) {
		logger.error("Failed to save recording:", error);
	}
}

/** Handle operation result */
function handleOperationResult(result: {
	success: boolean;
	error?: string;
}): void {
	logger.debug("Operation result:", result);

	// Send result to iframe
	if (iframeManager.isCreated()) {
		iframeManager.sendMessage(
			createMessage(MessageType.OPERATION_RESULT, result),
		);
	}
}

/** Handle iframe messages */
function handleIframeMessage(message: AgentMessage): void {
	logger.debug("Received message from iframe:", message.type);

	switch (message.type) {
		case MessageType.EXECUTE_OPERATION: {
			const payload = message.payload as {
				action: "click" | "input" | "submit" | "navigate";
				selector: string;
				fallbackSelector?: string;
				value?: string;
			};
			operator.execute({
				action: payload.action,
				selector: payload.selector,
				fallbackSelector: payload.fallbackSelector,
				value: payload.value,
			});
			break;
		}

		case MessageType.START_LEARN_MODE:
			startLearnMode();
			break;

		case MessageType.STOP_LEARN_MODE:
		case MessageType.STOP_RECORDING:
			stopRecording();
			break;

		case MessageType.PAUSE_RECORDING:
			pauseRecording();
			break;

		case MessageType.RESUME_RECORDING:
			resumeRecording();
			break;

		case MessageType.START_GUIDE_MODE:
			startGuideMode();
			break;

		case MessageType.START_ACTIVE_MODE:
			startActiveMode();
			break;

		default:
			logger.warn("Unknown message type:", message.type);
	}
}

/** Handle messages from background service worker */
function handleBackgroundMessage(
	message: AgentMessage,
	_sender: chrome.runtime.MessageSender,
	sendResponse: (response?: AgentMessage) => void,
): boolean {
	logger.debug("Received message from background:", message.type);

	switch (message.type) {
		case MessageType.GET_STATE:
			sendResponse(
				createMessage(MessageType.STATE_UPDATE, {
					mode: _agentMode,
					isRecording: recorder.isRecording(),
					isPaused: recorder.isPaused(),
					sessionId: recorder.getSessionId(),
					config: _config,
				}),
			);
			break;

		case MessageType.START_RECORDING:
			startRecording();
			sendResponse(createMessage(MessageType.STATE_UPDATE, { success: true }));
			break;

		case MessageType.STOP_RECORDING:
			stopRecording();
			sendResponse(createMessage(MessageType.STATE_UPDATE, { success: true }));
			break;

		case MessageType.IFRAME_MESSAGE: {
			// Forward iframe message to handler
			const iframeMessage = message.payload as unknown as AgentMessage;
			if (iframeMessage && iframeMessage.type) {
				handleIframeMessage(iframeMessage);
			}
			sendResponse(createMessage(MessageType.STATE_UPDATE, { success: true }));
			break;
		}

		default:
			logger.warn("Unhandled message type:", message.type);
	}

	return true;
}

/** Start learn mode */
function startLearnMode(): void {
	logger.info("Starting learn mode");
	_agentMode = AgentMode.LEARN;

	// Create iframe if not exists
	if (!iframeManager.isCreated()) {
		iframeManager.create(_agentMode);
	}

	// Start recording
	startRecording();

	// Update overlay
	overlay.updateState("recording");
}

/** Start guide mode */
function startGuideMode(): void {
	logger.info("Starting guide mode");
	_agentMode = AgentMode.GUIDE;

	// Create iframe if not exists
	if (!iframeManager.isCreated()) {
		iframeManager.create(_agentMode);
	}

	// Stop any active recording
	if (recorder.isRecording()) {
		stopRecording();
	}

	// Update overlay
	overlay.updateState("idle");
}

/** Start active mode */
function startActiveMode(): void {
	logger.info("Starting active mode");
	_agentMode = AgentMode.ACTIVE;

	// Create iframe if not exists
	if (!iframeManager.isCreated()) {
		iframeManager.create(_agentMode);
	}

	// Stop any active recording
	if (recorder.isRecording()) {
		stopRecording();
	}

	// Update overlay
	overlay.updateState("idle");
}

/** Start recording */
function startRecording(): void {
	if (recorder.isRecording()) {
		logger.warn("Already recording");
		return;
	}

	logger.info("Starting recording");
	recorder.start();
	_recordingStartTime = Date.now();

	// Update overlay
	overlay.updateState("recording");

	// Start duration timer
	startDurationTimer();

	// Broadcast state to iframe
	broadcastStateUpdate();
}

/** Stop recording */
function stopRecording(): void {
	if (!recorder.isRecording()) {
		logger.warn("Not recording");
		return;
	}

	logger.info("Stopping recording");
	recorder.stop();

	// Update overlay
	overlay.updateState("idle");

	// Stop duration timer
	stopDurationTimer();

	// Broadcast state to iframe
	broadcastStateUpdate();
}

/** Pause recording */
function pauseRecording(): void {
	if (!recorder.isRecording() || recorder.isPaused()) {
		logger.warn("Cannot pause: not recording or already paused");
		return;
	}

	logger.info("Pausing recording");
	recorder.pause();

	// Update overlay
	overlay.updateState("paused");

	// Broadcast state to iframe
	broadcastStateUpdate();
}

/** Resume recording */
function resumeRecording(): void {
	if (!recorder.isRecording() || !recorder.isPaused()) {
		logger.warn("Cannot resume: not recording or not paused");
		return;
	}

	logger.info("Resuming recording");
	recorder.resume();

	// Update overlay
	overlay.updateState("recording");

	// Broadcast state to iframe
	broadcastStateUpdate();
}

/** Start duration timer */
function startDurationTimer(): void {
	stopDurationTimer();
	_durationTimer = setInterval(() => {
		const elapsed = Math.floor((Date.now() - _recordingStartTime) / 1000);
		overlay.updateDuration(elapsed);
	}, 1000);
}

/** Stop duration timer */
function stopDurationTimer(): void {
	if (_durationTimer) {
		clearInterval(_durationTimer);
		_durationTimer = null;
	}
	overlay.updateDuration(0);
}

/** Broadcast state update to iframe */
function broadcastStateUpdate(): void {
	if (!iframeManager.isCreated()) {
		return;
	}

	iframeManager.sendMessage(
		createMessage(MessageType.STATE_UPDATE, {
			mode: _agentMode,
			isRecording: recorder.isRecording(),
			isPaused: recorder.isPaused(),
			sessionId: recorder.getSessionId(),
			config: _config,
		}),
	);
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
			startRecording: () => void;
			stopRecording: () => void;
			pauseRecording: () => void;
			resumeRecording: () => void;
			startLearnMode: () => void;
			startGuideMode: () => void;
			startActiveMode: () => void;
			destroyIframe: () => void;
		};
	}
}

// Attach to window for debugging
window.neoAgent = {
	recorder,
	operator,
	overlay,
	iframeManager,
	storage,
	configModule,
	startRecording,
	stopRecording,
	pauseRecording,
	resumeRecording,
	startLearnMode,
	startGuideMode,
	startActiveMode,
	destroyIframe: () => iframeManager.destroy(),
};
