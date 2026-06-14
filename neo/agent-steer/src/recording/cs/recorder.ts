/**
 * Content Script Recorder Module
 *
 * Handles communication with rrweb-bridge.js and manages recording state.
 * Runs in the isolated world of content scripts.
 */

import type { RecordingState } from "../types";
import * as db from "../db/indexeddb";

// Storage API (兼容 browser 和 chrome)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _browser = typeof browser !== "undefined" ? browser : (chrome as any);
const storage = _browser?.storage;

// Storage keys (matching lib/storage.ts)
const STORAGE_KEYS = {
	RECORDING_CMD: "recording.cmd",
	RECORDING_STATE: "recording.state",
} as const;

// Polling interval
const POLL_INTERVAL = 500; // ms

// State
let lastCmd: { action: string } | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let recordingState: RecordingState = {
	isRecording: false,
	isPaused: false,
	duration: 0,
	segmentCount: 0,
	eventCount: 0,
};
let sessionId: string | null = null;
let durationTimer: ReturnType<typeof setInterval> | null = null;

/** Bridge message from rrweb-bridge */
interface BridgeIncomingMessage {
	source: string;
	type: string;
	payload?: unknown;
}

/**
 * 初始化录制模块
 */
export async function initRecorder(): Promise<void> {
	console.log("[recorder] Initializing...");

	// 初始化 IndexedDB
	await db.initDB();

	// 检查是否有活跃会话
	const activeSession = await db.getActiveSession();
	if (activeSession) {
		console.log("[recorder] Found active session:", activeSession.uid);
		sessionId = activeSession.uid;

		// 获取该会话的片段数
		const segments = await db.getSegmentsBySession(sessionId);
		recordingState = {
			isRecording: false,
			isPaused: false,
			duration: 0,
			segmentCount: segments.length,
			eventCount: 0,
			sessionId: sessionId,
		};

		// 通知 popup 有待处理的录像
		await updateState();
	}

	// 启动命令轮询
	startPolling();

	// 监听来自 rrweb-bridge 的消息
	listenForBridgeMessages();

	console.log("[recorder] Initialized");
}

/**
 * 启动轮询
 */
function startPolling(): void {
	if (pollTimer) return;

	pollTimer = setInterval(async () => {
		try {
			const cmd = await getRecordingCmd();
			if (cmd && JSON.stringify(cmd) !== JSON.stringify(lastCmd)) {
				lastCmd = cmd;
				await handleCommand(cmd);
			}
		} catch (error) {
			console.error("[recorder] Poll error:", error);
		}
	}, POLL_INTERVAL);
}

/**
 * 停止轮询
 */
function stopPolling(): void {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
}

/**
 * 获取录制命令
 */
async function getRecordingCmd(): Promise<{ action: string } | null> {
	return new Promise((resolve) => {
		storage?.local?.get(
			[STORAGE_KEYS.RECORDING_CMD],
			(result: Record<string, unknown>) => {
				const cmd = result[STORAGE_KEYS.RECORDING_CMD] as
					| { action: string }
					| undefined;
				resolve(cmd || null);
			},
		);
	});
}

/**
 * 清除录制命令
 */
async function clearRecordingCmd(): Promise<void> {
	return new Promise((resolve) => {
		storage?.local?.remove([STORAGE_KEYS.RECORDING_CMD], resolve);
	});
}

/**
 * 处理命令
 */
async function handleCommand(cmd: { action: string }): Promise<void> {
	console.log("[recorder] Handling command:", cmd.action);

	switch (cmd.action) {
		case "start":
			await startRecording();
			break;
		case "pause":
			await pauseRecording();
			break;
		case "resume":
			await resumeRecording();
			break;
		case "stop":
			await stopRecording();
			break;
	}

	// 清除命令
	await clearRecordingCmd();
	lastCmd = null;
}

/**
 * 监听来自 rrweb-bridge 的消息
 */
function listenForBridgeMessages(): void {
	window.addEventListener(
		"message",
		(event: MessageEvent<BridgeIncomingMessage>) => {
			// 只处理来自自己的消息
			if (event.source !== window) return;

			const data = event.data;
			if (!data || data.source !== "rrweb-bridge") return;

			console.log("[recorder] Received bridge message:", data.type);

			switch (data.type) {
				case "segment-flushed": {
					const payload = data.payload as {
						uid: string;
						sessionId: string;
						sequence: number;
						eventCount: number;
					};
					handleSegmentFlushed(payload);
					break;
				}
				case "recording-started": {
					const payload = data.payload as {
						sessionId: string;
						segmentUid: string;
					};
					handleRecordingStarted(payload);
					break;
				}
				case "recording-paused":
					handleRecordingPaused();
					break;
				case "recording-resumed":
					handleRecordingResumed();
					break;
				case "recording-stopped": {
					const payload = data.payload as {
						sessionId: string;
						totalDuration: number;
					};
					handleRecordingStopped(payload);
					break;
				}
			}
		},
	);
}

/**
 * 处理片段 flush 事件
 */
async function handleSegmentFlushed(payload: {
	uid: string;
	sessionId: string;
	sequence: number;
	eventCount: number;
}): Promise<void> {
	console.log("[recorder] Segment flushed:", payload.uid);

	recordingState.segmentCount++;
	recordingState.eventCount += payload.eventCount;

	await updateState();
}

/**
 * 处理录制开始
 */
async function handleRecordingStarted(payload: {
	sessionId: string;
	segmentUid: string;
}): Promise<void> {
	sessionId = payload.sessionId;
	recordingState = {
		isRecording: true,
		isPaused: false,
		duration: 0,
		segmentCount: 1,
		eventCount: 0,
		sessionId: sessionId,
	};

	// 启动时长计时器
	startDurationTimer();

	await updateState();
}

/**
 * 处理录制暂停
 */
async function handleRecordingPaused(): Promise<void> {
	recordingState.isPaused = true;
	stopDurationTimer();
	await updateState();
}

/**
 * 处理录制恢复
 */
async function handleRecordingResumed(): Promise<void> {
	recordingState.isPaused = false;
	startDurationTimer();
	await updateState();
}

/**
 * 处理录制停止
 */
async function handleRecordingStopped(payload: {
	sessionId: string;
	totalDuration: number;
}): Promise<void> {
	stopDurationTimer();

	recordingState = {
		isRecording: false,
		isPaused: false,
		duration: payload.totalDuration,
		segmentCount: recordingState.segmentCount,
		eventCount: recordingState.eventCount,
		sessionId: payload.sessionId,
	};

	sessionId = null;
	await updateState();
}

/**
 * 更新录制状态到 storage
 */
async function updateState(): Promise<void> {
	return new Promise((resolve) => {
		storage?.local?.set(
			{ [STORAGE_KEYS.RECORDING_STATE]: recordingState },
			resolve,
		);
	});
}

/**
 * 启动时长计时器
 */
function startDurationTimer(): void {
	if (durationTimer) return;

	const startTime = Date.now() - recordingState.duration;
	durationTimer = setInterval(() => {
		recordingState.duration = Date.now() - startTime;
		updateState();
	}, 1000);
}

/**
 * 停止时长计时器
 */
function stopDurationTimer(): void {
	if (durationTimer) {
		clearInterval(durationTimer);
		durationTimer = null;
	}
}

// ==================== Public API ====================

/**
 * 开始录制
 */
export async function startRecording(): Promise<void> {
	// 发送消息给 rrweb-bridge
	window.postMessage(
		{
			source: "rrweb-control",
			type: "start",
		},
		"*",
	);
}

/**
 * 暂停录制
 */
export async function pauseRecording(): Promise<void> {
	window.postMessage(
		{
			source: "rrweb-control",
			type: "pause",
		},
		"*",
	);
}

/**
 * 恢复录制
 */
export async function resumeRecording(): Promise<void> {
	window.postMessage(
		{
			source: "rrweb-control",
			type: "resume",
		},
		"*",
	);
}

/**
 * 停止录制
 */
export async function stopRecording(): Promise<void> {
	window.postMessage(
		{
			source: "rrweb-control",
			type: "stop",
		},
		"*",
	);
}

/**
 * 获取当前状态
 */
export function getState(): RecordingState {
	return { ...recordingState };
}

/**
 * 获取活跃会话 ID
 */
export function getSessionId(): string | null {
	return sessionId;
}

/**
 * 清理资源
 */
export function cleanup(): void {
	stopPolling();
	stopDurationTimer();
}
