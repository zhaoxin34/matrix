/**
 * rrweb-bridge.js
 *
 * This script is injected into the page's main world via Service Worker.
 * It wraps rrweb recording and handles segment management.
 *
 * Communication with Content Script via window.postMessage.
 */

(() => {
	// Prevent multiple initializations
	if (window.__RRWEB_BRIDGE__) {
		console.log("[rrweb-bridge] Already initialized");
		return;
	}

	// Configuration
	const SEGMENT_FLUSH_INTERVAL = 10 * 60 * 1000; // 10 minutes
	const DB_NAME = "neo-agent-recordings";
	const DB_VERSION = 1;
	const SEGMENTS_STORE = "segments";
	const SESSIONS_STORE = "sessions";

	// State
	let db = null;
	let recorder = null;
	let currentSessionId = null;
	let currentSegment = null;
	let segmentSequence = 0;
	let events = [];
	let pageUrls = [];
	let isPaused = false;
	let flushTimer = null;
	let startTime = null;

	// ==================== IndexedDB ====================

	function openDB() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			request.onupgradeneeded = (event) => {
				const database = event.target.result;

				if (!database.objectStoreNames.contains(SEGMENTS_STORE)) {
					const segmentsStore = database.createObjectStore(SEGMENTS_STORE, {
						keyPath: "uid",
					});
					segmentsStore.createIndex("sessionId", "sessionId", {
						unique: false,
					});
					segmentsStore.createIndex("createdAt", "createdAt", {
						unique: false,
					});
					segmentsStore.createIndex("synced", "synced", { unique: false });
				}

				if (!database.objectStoreNames.contains(SESSIONS_STORE)) {
					const sessionsStore = database.createObjectStore(SESSIONS_STORE, {
						keyPath: "uid",
					});
					sessionsStore.createIndex("active", "active", { unique: false });
				}
			};
		});
	}

	async function ensureDB() {
		if (!db) {
			db = await openDB();
		}
		return db;
	}

	async function saveSegment(segment) {
		const database = await ensureDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction(SEGMENTS_STORE, "readwrite");
			const store = tx.objectStore(SEGMENTS_STORE);
			const request = store.put(segment);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async function saveSession(session) {
		const database = await ensureDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction(SESSIONS_STORE, "readwrite");
			const store = tx.objectStore(SESSIONS_STORE);
			const request = store.put(session);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	// ==================== Segment Management ====================

	function generateUUID() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	function createNewSegment() {
		segmentSequence++;
		currentSegment = {
			uid: generateUUID(),
			sessionId: currentSessionId,
			sequence: segmentSequence,
			startTime: Date.now(),
			endTime: null,
			eventCount: 0,
			events: null, // Will be set when flushing
			pageUrls: [],
			createdAt: Date.now(),
			synced: false,
		};
		events = [];
		pageUrls = [window.location.href];
	}

	async function flushSegment() {
		if (!currentSegment || events.length === 0) {
			console.log("[rrweb-bridge] No events to flush");
			return null;
		}

		currentSegment.endTime = Date.now();
		currentSegment.eventCount = events.length;
		currentSegment.events = JSON.stringify(events);
		currentSegment.pageUrls = [...new Set(pageUrls)];

		try {
			await saveSegment(currentSegment);
			console.log(
				"[rrweb-bridge] Segment flushed:",
				currentSegment.uid,
				"events:",
				currentSegment.eventCount,
			);

			// Notify content script
			window.postMessage(
				{
					source: "rrweb-bridge",
					type: "segment-flushed",
					payload: {
						uid: currentSegment.uid,
						sessionId: currentSessionId,
						sequence: currentSegment.sequence,
						eventCount: currentSegment.eventCount,
					},
				},
				"*",
			);

			const flushedSegment = currentSegment;
			createNewSegment();
			return flushedSegment;
		} catch (error) {
			console.error("[rrweb-bridge] Failed to flush segment:", error);
			return null;
		}
	}

	// ==================== rrweb Recording ====================

	function handleEvent(event) {
		if (isPaused) return;

		events.push(event);

		// Track page URLs
		if (event.type === 4) {
			// DOM meta event
			if (
				event.data &&
				event.data.href &&
				!pageUrls.includes(event.data.href)
			) {
				pageUrls.push(event.data.href);
			}
		}
	}

	async function startRecording() {
		if (recorder) {
			console.log("[rrweb-bridge] Already recording");
			return;
		}

		try {
			// Generate session ID
			currentSessionId = generateUUID();
			segmentSequence = 0;
			startTime = Date.now();

			// Create session record
			await saveSession({
				uid: currentSessionId,
				startTime: startTime,
				active: true,
				createdAt: Date.now(),
			});

			// Create first segment
			createNewSegment();

			// Check if rrweb is available
			if (typeof rrweb === "undefined" || typeof rrweb.record !== "function") {
				console.error("[rrweb-bridge] rrweb not available");
				return;
			}

			// Start recording
			recorder = rrweb.record({
				emit: handleEvent,
				recordOptions: {
					// Collect input events
					recordInputOptions: true,
					// Collect scroll events
					collectStackTrace: false,
					// Sampling
					sampling: {
						// Don't sample anything, record all events
					},
				},
			});

			if (!recorder) {
				console.error("[rrweb-bridge] Failed to start recorder");
				return;
			}

			// Start flush timer
			flushTimer = setInterval(() => {
				console.log("[rrweb-bridge] Timer triggered flush");
				flushSegment();
			}, SEGMENT_FLUSH_INTERVAL);

			console.log(
				"[rrweb-bridge] Recording started, session:",
				currentSessionId,
			);

			// Notify content script
			window.postMessage(
				{
					source: "rrweb-bridge",
					type: "recording-started",
					payload: {
						sessionId: currentSessionId,
						segmentUid: currentSegment.uid,
					},
				},
				"*",
			);
		} catch (error) {
			console.error("[rrweb-bridge] Failed to start recording:", error);
		}
	}

	function pauseRecording() {
		if (!recorder) return;

		isPaused = true;
		console.log("[rrweb-bridge] Recording paused");

		window.postMessage(
			{
				source: "rrweb-bridge",
				type: "recording-paused",
				payload: { sessionId: currentSessionId },
			},
			"*",
		);
	}

	function resumeRecording() {
		if (!recorder) return;

		isPaused = false;
		console.log("[rrweb-bridge] Recording resumed");

		window.postMessage(
			{
				source: "rrweb-bridge",
				type: "recording-resumed",
				payload: { sessionId: currentSessionId },
			},
			"*",
		);
	}

	async function stopRecording() {
		if (!recorder) return;

		console.log("[rrweb-bridge] Stopping recording");

		// Stop timer
		if (flushTimer) {
			clearInterval(flushTimer);
			flushTimer = null;
		}

		// Flush any remaining events
		await flushSegment();

		// Stop rrweb
		if (recorder && typeof recorder.stop === "function") {
			recorder.stop();
		}
		recorder = null;

		// Mark session as ended
		if (currentSessionId) {
			try {
				await saveSession({
					uid: currentSessionId,
					startTime: startTime,
					endTime: Date.now(),
					active: false,
					createdAt: startTime,
				});
			} catch (e) {
				console.error("[rrweb-bridge] Failed to update session:", e);
			}
		}

		console.log("[rrweb-bridge] Recording stopped");

		window.postMessage(
			{
				source: "rrweb-bridge",
				type: "recording-stopped",
				payload: {
					sessionId: currentSessionId,
					totalDuration: Date.now() - startTime,
				},
			},
			"*",
		);

		currentSessionId = null;
		currentSegment = null;
		events = [];
		isPaused = false;
	}

	// ==================== Message Handling ====================

	window.addEventListener("message", (event) => {
		// Only accept messages from the page (our content script uses postMessage too)
		if (event.source !== window) return;

		const data = event.data;
		if (!data || data.source !== "rrweb-control") return;

		console.log("[rrweb-bridge] Received command:", data.type);

		switch (data.type) {
			case "start":
				startRecording();
				break;
			case "pause":
				pauseRecording();
				break;
			case "resume":
				resumeRecording();
				break;
			case "stop":
				stopRecording();
				break;
			case "flush":
				flushSegment();
				break;
			case "get-status":
				window.postMessage(
					{
						source: "rrweb-bridge",
						type: "status",
						payload: {
							isRecording: !!recorder,
							isPaused: isPaused,
							sessionId: currentSessionId,
							currentSegmentUid: currentSegment?.uid,
							eventCount: events.length,
						},
					},
					"*",
				);
				break;
			default:
				console.warn("[rrweb-bridge] Unknown command:", data.type);
		}
	});

	// ==================== Expose API ====================

	window.__RRWEB_BRIDGE__ = {
		start: startRecording,
		pause: pauseRecording,
		resume: resumeRecording,
		stop: stopRecording,
		flush: flushSegment,
		getStatus: () => ({
			isRecording: !!recorder,
			isPaused: isPaused,
			sessionId: currentSessionId,
			currentSegmentUid: currentSegment?.uid,
			eventCount: events.length,
		}),
	};

	console.log("[rrweb-bridge] Initialized");
})();
