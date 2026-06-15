/**
 * rrweb 录制器 - 注入到主世界运行
 *
 * 这个脚本直接运行在页面主世界中，
 * 可以访问真正的 window.rrwebRecord
 */

(() => {
	// 避免重复加载
	if (window.__recorderInitialized) {
		return;
	}
	window.__recorderInitialized = true;

	const SEGMENT_FLUSH_INTERVAL = 10 * 60 * 1000; // 10 分钟

	// 状态
	let rrwebRecorder = null;
	let currentSessionId = null;
	let currentSegmentUid = null;
	let segmentSequence = 0;
	let events = [];
	let pageUrls = new Set([window.location.href]);
	let isPaused = false;
	let flushTimer = null;
	let startTime = null;
	let dbInitialized = false;

	// IndexedDB
	const DB_NAME = "neo-agent-recordings";
	const DB_VERSION = 1;

	function initDB() {
		return new Promise((resolve, reject) => {
			if (dbInitialized) {
				resolve();
				return;
			}

			var request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				console.error("[recorder] IndexedDB error:", request.error);
				reject(request.error);
			};

			request.onupgradeneeded = (event) => {
				console.log("[recorder] Upgrading database to version", DB_VERSION);
				var db = event.target.result;

				if (!db.objectStoreNames.contains("sessions")) {
					db.createObjectStore("sessions", { keyPath: "uid" });
				}
				if (!db.objectStoreNames.contains("segments")) {
					db.createObjectStore("segments", { keyPath: "uid" });
				}
			};

			request.onsuccess = () => {
				console.log("[recorder] Database opened successfully");
				dbInitialized = true;
				resolve();
			};
		});
	}

	function generateUUID() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
			var r = (Math.random() * 16) | 0;
			var v = c === "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	function createNewSegment() {
		segmentSequence++;
		currentSegmentUid = generateUUID();
		events = [];
		pageUrls = new Set([window.location.href]);

		return {
			uid: currentSegmentUid,
			sessionId: currentSessionId,
			sequence: segmentSequence,
			startTime: Date.now(),
		};
	}

	function saveToStore(storeName, data) {
		return new Promise((resolve, reject) => {
			var request = indexedDB.open(DB_NAME, 1);
			request.onsuccess = () => {
				var db = request.result;
				var transaction = db.transaction(storeName, "readwrite");
				var store = transaction.objectStore(storeName);
				var putRequest = store.put(data);
				putRequest.onsuccess = () => resolve();
				putRequest.onerror = () => reject(putRequest.error);
			};
			request.onerror = () => reject(request.error);
		});
	}

	function flushSegment(force = false) {
		return new Promise((resolve, reject) => {
			// force=true 时，即使只有很少的事件也保存（比如暂停时）
			// 正常情况下，events.length === 0 时不保存
			if (!currentSegmentUid || (events.length === 0 && !force)) {
				resolve(null);
				return;
			}

			var segment = {
				uid: currentSegmentUid,
				sessionId: currentSessionId,
				sequence: segmentSequence,
				startTime: events.length > 0 ? events[0].timestamp : Date.now(),
				endTime:
					events.length > 0 ? events[events.length - 1].timestamp : Date.now(),
				eventCount: events.length,
				events: JSON.stringify(events),
				pageUrls: Array.from(pageUrls),
				createdAt: Date.now(),
				synced: false,
			};

			saveToStore("segments", segment)
				.then(() => {
					console.log(
						"[recorder] Segment flushed:",
						currentSegmentUid,
						"events:",
						events.length,
						force ? "(forced)" : "",
					);
					// 通知 CS segment 已保存（CS 会更新 segmentCount）
					window.postMessage(
						{
							source: "recorder-state",
							type: "segment-saved",
							segmentUid: currentSegmentUid,
							segmentSequence: segmentSequence,
						},
						"*",
					);
					createNewSegment();
					resolve(segment);
				})
				.catch((error) => {
					console.error("[recorder] Failed to flush segment:", error);
					reject(error);
				});
		});
	}

	function handleEvent(event) {
		if (isPaused) return;

		events.push(event);

		// Track page URLs
		if (event.type === 4) {
			var meta = event.data;
			if (meta && meta.href && !pageUrls.has(meta.href)) {
				pageUrls.add(meta.href);
			}
		}
	}

	function startRecording() {
		return new Promise((resolve, reject) => {
			if (rrwebRecorder) {
				console.log("[recorder] Already recording");
				resolve({ success: false, error: "Already recording" });
				return;
			}

			if (!window.rrwebRecord || !window.rrwebRecord.record) {
				console.error("[recorder] rrweb not available");
				resolve({ success: false, error: "rrweb not available" });
				return;
			}

			initDB()
				.then(() => {
					currentSessionId = generateUUID();
					segmentSequence = 0;
					startTime = Date.now();

					var session = {
						uid: currentSessionId,
						startTime: startTime,
						active: true,
						createdAt: startTime,
					};

					return saveToStore("sessions", session).then(() => session);
				})
				.then(() => {
					createNewSegment();

					var recorder = window.rrwebRecord.record({
						emit: handleEvent,
					});

					if (!recorder) {
						console.error("[recorder] Failed to start recorder");
						currentSessionId = null;
						resolve({ success: false, error: "Failed to start recorder" });
						return;
					}

					rrwebRecorder = recorder;

					flushTimer = setInterval(() => {
						flushSegment();
					}, SEGMENT_FLUSH_INTERVAL);

					console.log(
						"[recorder] Recording started, session:",
						currentSessionId,
					);

					resolve({ success: true, sessionId: currentSessionId });
				})
				.catch((error) => {
					console.error("[recorder] Failed to start recording:", error);
					resolve({ success: false, error: String(error) });
				});
		});
	}

	function pauseRecording() {
		return new Promise((resolve, reject) => {
			if (!rrwebRecorder) {
				resolve({ success: false, error: "Not recording" });
				return;
			}
			isPaused = true;
			console.log("[recorder] Recording paused, flushing segment");
			// 暂停时强制保存 segment（即使只有很少事件）
			flushSegment(true).then(() => {
				resolve({ success: true });
			});
		});
	}

	function resumeRecording() {
		return new Promise((resolve, reject) => {
			if (!rrwebRecorder) {
				resolve({ success: false, error: "Not recording" });
				return;
			}
			isPaused = false;
			console.log("[recorder] Recording resumed");
			resolve({ success: true });
		});
	}

	function stopRecording() {
		return new Promise((resolve, reject) => {
			if (!rrwebRecorder) {
				resolve({ success: false, error: "Not recording" });
				return;
			}

			console.log("[recorder] Stopping recording");

			if (flushTimer) {
				clearInterval(flushTimer);
				flushTimer = null;
			}

			// 停止时强制保存 segment
			flushSegment(true)
				.then(() => {
					if (rrwebRecorder && typeof rrwebRecorder.stop === "function") {
						rrwebRecorder.stop();
					}
					rrwebRecorder = null;

					if (currentSessionId) {
						var session = {
							uid: currentSessionId,
							startTime: startTime,
							endTime: Date.now(),
							active: false,
							createdAt: startTime,
						};
						return saveToStore("sessions", session);
					}
				})
				.then(() => {
					console.log("[recorder] Recording stopped");

					currentSessionId = null;
					currentSegmentUid = null;
					events = [];
					isPaused = false;

					resolve({ success: true });
				})
				.catch((e) => {
					console.error("[recorder] Failed to update session:", e);
					resolve({ success: true }); // Still resolve as stopped
				});
		});
	}

	function resetRecorder() {
		return new Promise((resolve) => {
			console.log("[recorder] Resetting recorder state");

			// 停止定时器
			if (flushTimer) {
				clearInterval(flushTimer);
				flushTimer = null;
			}

			// 停止 rrweb 录制
			if (rrwebRecorder) {
				if (typeof rrwebRecorder.stop === "function") {
					rrwebRecorder.stop();
				}
				rrwebRecorder = null;
			}

			// 重置所有状态
			currentSessionId = null;
			currentSegmentUid = null;
			events = [];
			isPaused = false;
			segmentSequence = 0;
			startTime = null;

			console.log("[recorder] Recorder state reset");
			resolve({ success: true });
		});
	}

	function getStatus() {
		return {
			isRecording: !!rrwebRecorder,
			isPaused: isPaused,
			sessionId: currentSessionId,
			eventCount: events.length,
			segmentCount: segmentSequence,
		};
	}

	function clearAllData() {
		return new Promise((resolve) => {
			console.log("[recorder] Clearing all IndexedDB data");

			var request = indexedDB.open(DB_NAME, 1);
			request.onsuccess = () => {
				var db = request.result;

				// 清除 segments
				var segmentsTx = db.transaction("segments", "readwrite");
				segmentsTx.objectStore("segments").clear();

				// 清除 sessions
				var sessionsTx = db.transaction("sessions", "readwrite");
				sessionsTx.objectStore("sessions").clear();

				// 等待事务完成
				segmentsTx.oncomplete = () => {
					sessionsTx.oncomplete = () => {
						console.log("[recorder] All IndexedDB data cleared");
						resolve({ success: true });
					};
				};
			};
			request.onerror = () => {
				console.error("[recorder] Failed to open IndexedDB for clearing");
				resolve({ success: false, error: "Failed to open DB" });
			};
		});
	}

	window.addEventListener("message", (event) => {
		if (event.source !== window) return;
		if (!event.data || event.data.source !== "recorder-control") return;

		var data = event.data;
		var action = data.action;
		var id = data.id;

		console.log("[recorder] Received message:", action);

		var promise;
		var error = null;

		try {
			switch (action) {
				case "start":
					promise = startRecording();
					break;
				case "pause":
					promise = pauseRecording();
					break;
				case "resume":
					promise = resumeRecording();
					break;
				case "stop":
					promise = stopRecording();
					break;
				case "status":
					promise = Promise.resolve(getStatus());
					break;
				case "flush":
					// 手动触发 segment 保存（用于测试）
					promise = Promise.resolve(flushSegment());
					break;
				case "reset":
					// 重置 recorder 状态（清除后重新开始）
					promise = resetRecorder();
					break;
				case "clear":
					// 清除 IndexedDB 中的所有录制数据
					promise = clearAllData();
					break;
				default:
					error = "Unknown action: " + action;
			}
		} catch (e) {
			error = String(e);
		}

		if (error) {
			window.postMessage(
				{
					source: "recorder-response",
					type: data.type,
					id: id,
					success: false,
					result: null,
					error: error,
				},
				"*",
			);
		} else if (promise) {
			promise.then((result) => {
				window.postMessage(
					{
						source: "recorder-response",
						type: data.type,
						id: id,
						success: true,
						result: result,
						error: null,
					},
					"*",
				);
			});
		}
	});

	console.log("[recorder] Initialized and listening for commands");
})();
