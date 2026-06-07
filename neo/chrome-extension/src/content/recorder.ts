/**
 * Content Recorder Module
 * Handles rrweb recording, event capture, and batching
 */

import { record } from "rrweb";
import type { eventWithTime } from "@rrweb/types";
import { createLogger } from "@shared/utils";

const logger = createLogger("Recorder");

/** Recording state */
export interface RecordingData {
	sessionId: string;
	events: eventWithTime[];
	startTime: number;
	endTime: number;
}

/** Callback type for recording events */
type EventCallback = (data: RecordingData) => void;

/** Recorder module interface */
export interface RecorderModule {
	start: () => void;
	stop: () => RecordingData | null;
	pause: () => void;
	resume: () => void;
	isRecording: () => boolean;
	isPaused: () => boolean;
	getSessionId: () => string | null;
	onRecordingComplete: (callback: EventCallback) => void;
}

/** Create recorder module */
export function createRecorder(): RecorderModule {
	// State
	let _isRecording = false;
	let _isPaused = false;
	let _sessionId: string | null = null;
	let _startTime = 0;
	let _events: eventWithTime[] = [];
	let _pendingEvents: eventWithTime[] = [];
	let _rrwebListener: (() => void) | null = null;
	let _batchTimer: ReturnType<typeof setInterval> | null = null;
	let _completionCallbacks: EventCallback[] = [];

	// Batch interval (500ms as per design)
	const BATCH_INTERVAL_MS = 500;

	/** Start recording */
	function start(): void {
		if (_isRecording) {
			logger.warn("Already recording");
			return;
		}

		logger.info("Starting recording");
		_isRecording = true;
		_isPaused = false;
		_sessionId = crypto.randomUUID();
		_startTime = Date.now();
		_events = [];
		_pendingEvents = [];

		// Start rrweb recording
		_rrwebListener = record({
			emit: (event: eventWithTime) => {
				if (!_isPaused) {
					_pendingEvents.push(event);
				}
			},
			recordCanvas: true,
			recordCrossOriginIframes: true,
			sampling: {
				input: "all" as const,
				media: 500,
			},
		});

		// Start batch timer
		_batchTimer = setInterval(() => {
			flushPendingEvents();
		}, BATCH_INTERVAL_MS);

		logger.info("Recording started, session:", _sessionId);
	}

	/** Stop recording */
	function stop(): RecordingData | null {
		if (!_isRecording) {
			logger.warn("Not recording");
			return null;
		}

		logger.info("Stopping recording, session:", _sessionId);
		_isRecording = false;
		_isPaused = false;

		// Flush remaining events
		flushPendingEvents();

		// Stop rrweb recording
		if (_rrwebListener) {
			_rrwebListener();
			_rrwebListener = null;
		}

		// Clear batch timer
		if (_batchTimer) {
			clearInterval(_batchTimer);
			_batchTimer = null;
		}

		const endTime = Date.now();
		const recordingData: RecordingData = {
			sessionId: _sessionId!,
			events: [..._events],
			startTime: _startTime,
			endTime,
		};

		logger.info(
			`Recording stopped. Total events: ${_events.length}, Duration: ${endTime - _startTime}ms`,
		);

		// Call all completion callbacks
		for (const callback of _completionCallbacks) {
			callback(recordingData);
		}

		_sessionId = null;

		return recordingData;
	}

	/** Pause recording */
	function pause(): void {
		if (!_isRecording || _isPaused) {
			logger.warn("Cannot pause: not recording or already paused");
			return;
		}

		logger.info("Pausing recording");
		_isPaused = true;
	}

	/** Resume recording */
	function resume(): void {
		if (!_isRecording || !_isPaused) {
			logger.warn("Cannot resume: not recording or not paused");
			return;
		}

		logger.info("Resuming recording");
		_isPaused = false;
	}

	/** Flush pending events to main events array */
	function flushPendingEvents(): void {
		if (_pendingEvents.length > 0) {
			_events.push(..._pendingEvents);
			_pendingEvents = [];
		}
	}

	// Public API
	return {
		start,
		stop,
		pause,
		resume,
		isRecording: () => _isRecording,
		isPaused: () => _isPaused,
		getSessionId: () => _sessionId,
		onRecordingComplete: (callback: EventCallback) => {
			_completionCallbacks.push(callback);
		},
	};
}

/** Default recorder instance */
export const recorder = createRecorder();
