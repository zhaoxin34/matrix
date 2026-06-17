/**
 * Recording v2 CS - 命令实现
 *
 * 4 个命令：start / pause / resume / stop
 *
 * 3c 范围：
 *   - start: createRecording + 启动 rrweb + 分配 segmentUid + 持久化 recordingUid
 *   - pause: 停 rrweb 拿 events + finishAndPause + 切到 paused
 *   - resume: 启动 rrweb + 分配新 segmentUid + 切到 recording
 *   - stop: 停 rrweb + finishAndStop + 清持久化 + 清状态
 *
 * 3c 不做：
 *   - 4 个 trigger (在 triggers.ts)
 *   - pageUrls 收集（暂用当前 href）
 */

import { logger } from "@/common/logger";
import { createRecording, completeRecording } from "./api";
import { finishAndPause, finishAndStop, generateSegmentUid } from "./lifecycle";
import { getState, updateState, resetState } from "./state";
import { getAuthInfo } from "./auth";
import {
	startRecording,
	stopRecording,
	getEvents,
	clearEvents,
} from "./recorder";
import { saveRecordingState, clearRecordingState } from "./storage";
import { pushStateToPopup } from "./messages";

/**
 * 格式化 recording 名称
 * 设计文档约定：`录制 YYYY-MM-DD HH:mm:ss`
 */
function formatRecordingName(d: Date = new Date()): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	const y = d.getFullYear();
	const m = pad(d.getMonth() + 1);
	const day = pad(d.getDate());
	const hh = pad(d.getHours());
	const mm = pad(d.getMinutes());
	const ss = pad(d.getSeconds());
	return `录制 ${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

export async function handleStart(): Promise<void> {
	const { status, recordingUid } = getState();
	if (status !== "idle" || recordingUid) {
		logger.cs.warn("start: 已在录制中", { status, recordingUid });
		return;
	}

	const auth = await getAuthInfo();
	if (!auth) {
		logger.cs.error("start: 无 auth info");
		return;
	}

	try {
		const { uid, name: recordingName } = await createRecording(auth, {
			name: formatRecordingName(),
			enterUrl: window.location.href,
		});
		const startAt = Date.now();
		updateState({
			status: "recording",
			recordingUid: uid,
			recordingName,
			currentSegmentUid: generateSegmentUid(),
			currentSegmentStartTime: startAt,
			recordingStartedAt: startAt,
			totalPausedMs: 0,
		});
		// 启动 rrweb + 持久化
		await startRecording();
		await saveRecordingState(uid, startAt);
		logger.cs.info("start: recording created", uid);
	} catch (e) {
		logger.cs.error("start: 创建 recording 失败", e);
		return;
	}

	pushStateToPopup();
}

export async function handlePause(): Promise<void> {
	const { status, recordingUid, currentSegmentUid, currentSegmentStartTime } =
		getState();
	if (status !== "recording") {
		logger.cs.warn("pause: 非 recording 状态", { status });
		return;
	}
	if (!recordingUid || !currentSegmentUid || !currentSegmentStartTime) {
		logger.cs.error("pause: 状态不完整", { recordingUid, currentSegmentUid });
		return;
	}

	const auth = await getAuthInfo();
	if (!auth) return;

	stopRecording();
	const events = getEvents();

	try {
		await finishAndPause(
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
			status: "paused",
			currentSegmentUid: undefined,
			currentSegmentStartTime: undefined,
			pausedAt: Date.now(),
			segmentCount: getState().segmentCount + 1,
		});
		clearEvents();
		logger.cs.info("pause: segment 已上传", { events: events.length });
	} catch (e) {
		logger.cs.error("pause: 失败", e);
		return;
	}

	pushStateToPopup();
}

export async function handleResume(): Promise<void> {
	const { status, recordingUid } = getState();
	if (status !== "paused" || !recordingUid) {
		logger.cs.warn("resume: 状态错误", { status });
		return;
	}

	const { totalPausedMs, pausedAt } = getState();
	const extraPausedMs = pausedAt ? Date.now() - pausedAt : 0;
	updateState({
		status: "recording",
		currentSegmentUid: generateSegmentUid(),
		currentSegmentStartTime: Date.now(),
		pausedAt: undefined,
		totalPausedMs: totalPausedMs + extraPausedMs,
	});
	await startRecording();
	logger.cs.info("resume: 启动新 segment");

	pushStateToPopup();
}

export async function handleStop(): Promise<void> {
	const {
		status,
		recordingUid,
		currentSegmentUid,
		currentSegmentStartTime,
		segmentCount,
	} = getState();

	if (status === "idle") {
		logger.cs.warn("stop: 已 idle");
		return;
	}

	const auth = await getAuthInfo();
	if (!auth) {
		// 无 auth：仅清本地状态，不调后端
		resetState();
		await clearRecordingState();
		pushStateToPopup();
		return;
	}

	if (recordingUid && currentSegmentUid && currentSegmentStartTime) {
		stopRecording();
		const events = getEvents();
		try {
			await finishAndStop(
				{ ...auth, recordingUid },
				{
					segmentUid: currentSegmentUid,
					events: JSON.stringify(events),
					startTime: currentSegmentStartTime,
					endTime: Date.now(),
					pageUrls: [window.location.href],
				},
			);
			updateState({ segmentCount: segmentCount + 1 });
			clearEvents();
			logger.cs.info("stop: recording completed", { events: events.length });
		} catch (e) {
			logger.cs.error("stop: 失败", e);
			// 仍清本地状态（避免卡住）
		}
	} else if (recordingUid) {
		// paused 状态停止：只调 complete（不切 segment）
		try {
			await completeRecording(auth, { recordingUid });
			logger.cs.info("stop: paused → complete");
		} catch (e) {
			logger.cs.error("stop: complete 失败", e);
		}
	}

	resetState();
	await clearRecordingState();
	pushStateToPopup();
}
