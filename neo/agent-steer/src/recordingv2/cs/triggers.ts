/**
 * Recording v2 CS - 4 个 trigger + 重启续传
 *
 * 3c 范围：
 *   1. 10 分钟定时器
 *   2. visibilitychange 监听（active tab 切换）
 *   3. chrome.idle 监听（浏览器不活跃）
 *   4. chrome.tabs.onActivated 兜底（主信号用 visibilitychange）
 *   5. 重启续传：CS 启动时检测 storage
 *
 * 不监听 onActivated（每个 content script 都注册会重复广播）。
 * 跨 tab 接管靠"新 tab CS 启动时调 tryResumeRecording + 自身 visibility 变 visible" 覆盖。
 */

import { logger } from "@/common/logger";
import { getState, updateState } from "./state";
import { generateSegmentUid, finishAndContinue } from "./lifecycle";
import { getEvents, startRecording, stopRecording } from "./recorder";
import { getAuthInfo } from "./auth";
import {
	loadRecordingUid,
} from "./storage";
import { pushStateToPopup } from "./messages";

const TEN_MINUTES_MS = 10 * 60 * 1000;
const IDLE_THRESHOLD_SECONDS = 60;

let flushTimer: ReturnType<typeof setInterval> | null = null;

// ==================== 切 segment 公共逻辑 ====================

/**
 * 切当前 segment + 立即启动新 segment
 * 用于 10 分钟 / 切 tab 切回 / 不活跃恢复 / 重启续传
 */
async function cutAndContinue(): Promise<void> {
	const { status, recordingUid, currentSegmentUid, currentSegmentStartTime } =
		getState();
	if (status !== "recording" || !recordingUid || !currentSegmentUid || !currentSegmentStartTime) {
		return;
	}

	stopRecording();
	const events = getEvents();
	const auth = await getAuthInfo();
	if (!auth) {
		logger.cs.error("cutAndContinue: 无 auth, 跳过");
		return;
	}

	try {
		await finishAndContinue(
			{ ...auth, recordingUid },
			{
				segmentUid: currentSegmentUid,
				events: JSON.stringify(events),
				startTime: currentSegmentStartTime,
				endTime: Date.now(),
				pageUrls: [window.location.href],
			},
		);
		updateState({ segmentCount: getState().segmentCount + 1 });
		// 启动新 segment
		updateState({
			currentSegmentUid: generateSegmentUid(),
			currentSegmentStartTime: Date.now(),
		});
		startRecording();
		logger.cs.info("cutAndContinue: ok, events:", events.length);
	} catch (e) {
		logger.cs.error("cutAndContinue failed", e);
	}
}

/**
 * 切 segment 但不启动新 segment（用于切走场景）
 */
async function cutOnly(): Promise<void> {
	const { status, recordingUid, currentSegmentUid, currentSegmentStartTime } =
		getState();
	if (status !== "recording" || !recordingUid || !currentSegmentUid || !currentSegmentStartTime) {
		return;
	}

	stopRecording();
	const events = getEvents();
	const auth = await getAuthInfo();
	if (!auth) return;

	try {
		await finishAndContinue(
			{ ...auth, recordingUid },
			{
				segmentUid: currentSegmentUid,
				events: JSON.stringify(events),
				startTime: currentSegmentStartTime,
				endTime: Date.now(),
				pageUrls: [window.location.href],
			},
		);
		updateState({
			segmentCount: getState().segmentCount + 1,
			currentSegmentUid: undefined,
			currentSegmentStartTime: undefined,
		});
		logger.cs.info("cutOnly: ok");
	} catch (e) {
		logger.cs.error("cutOnly failed", e);
	}
}

/**
 * 接管活跃 recording / 启动新 segment
 *
 * 两种场景调到这里：
 *   1. 重启续传 / 新 tab 接管: state.recordingUid 缺失
 *      → 读 storage, 接管活跃 recording
 *   2. 切走 → 切回: state.recordingUid 在但 currentSegmentUid 缺失
 *      → 启动新 segment (不重新接管)
 */
async function takeover(): Promise<void> {
	const { status, recordingUid, currentSegmentUid } = getState();

	// 场景 2: 切走 → 切回, 启动新 segment
	if (recordingUid && status === "recording" && !currentSegmentUid) {
		updateState({
			currentSegmentUid: generateSegmentUid(),
			currentSegmentStartTime: Date.now(),
		});
		startRecording();
		logger.cs.info("takeover: 启动新 segment (切回)");
		return;
	}

	if (recordingUid) {
		// 已经有 recording 且状态正常，不动
		return;
	}

	// 场景 1: 重启续传
	const uid = await loadRecordingUid();
	if (!uid) return;

	logger.cs.info("takeover: 接管活跃 recording (重启续传)", { uid });
	updateState({
		status: "recording",
		recordingUid: uid,
		currentSegmentUid: generateSegmentUid(),
		currentSegmentStartTime: Date.now(),
		recordingStartedAt: Date.now(),
		totalPausedMs: 0,
	});
	startRecording();
	pushStateToPopup();
}

// ==================== Trigger 安装 ====================

/**
 * 10 分钟定时器
 */
export function setupFlushTimer(): void {
	if (flushTimer) return;
	flushTimer = setInterval(() => {
		const { status } = getState();
		if (status === "recording") {
			cutAndContinue().catch((e) =>
				logger.cs.error("10min trigger failed", e),
			);
		}
	}, TEN_MINUTES_MS);
	logger.cs.info("trigger: 10min flush timer set");
}

export function clearFlushTimer(): void {
	if (flushTimer) {
		clearInterval(flushTimer);
		flushTimer = null;
	}
}

/**
 * visibilitychange 监听
 *
 * - hidden: 切走, 切 segment (等用户切回)
 * - visible: 切回, 如果有活跃 recording, 启动新 segment
 */
export function setupVisibilityChange(): void {
	document.addEventListener("visibilitychange", () => {
		const { recordingUid } = getState();
		if (!recordingUid) return;

		if (document.hidden) {
			cutOnly().catch((e) =>
				logger.cs.error("visibility hidden trigger failed", e),
			);
		} else {
			takeover().catch((e) =>
				logger.cs.error("visibility visible trigger failed", e),
			);
		}
	});
	logger.cs.info("trigger: visibilitychange listener set");
}

/**
 * chrome.idle 监听
 * 60s 无活动 → 不活跃 → 切 segment
 * 回到活跃 → 启动新 segment
 */
export function setupChromeIdle(): void {
	if (!chrome.idle?.onStateChanged) {
		logger.cs.warn("trigger: chrome.idle API 不可用");
		return;
	}
	chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);
	chrome.idle.onStateChanged.addListener((newState) => {
		const { status, recordingUid } = getState();
		if (!recordingUid) return;

		if (newState === "idle" || newState === "locked") {
			if (status === "recording") {
				cutOnly().catch((e) =>
					logger.cs.error("idle trigger failed", e),
				);
			}
		} else if (newState === "active") {
			if (status === "recording") {
				cutAndContinue().catch((e) =>
					logger.cs.error("idle resume failed", e),
				);
			}
		}
	});
	logger.cs.info("trigger: chrome.idle listener set");
}

/**
 * 重启续传：CS 启动时检测
 * 调用方: initCSRecorderV2
 */
export async function tryResumeRecording(): Promise<boolean> {
	const uid = await loadRecordingUid();
	if (!uid) return false;
	logger.cs.info("resume: 检测到活跃 recording, 自动接管", { uid });
	await takeover();
	return true;
}
