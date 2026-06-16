/**
 * Recording v2 CS - 命令实现
 *
 * 4 个命令：start / pause / resume / stop
 *
 * 3a 范围：
 *   - start: createRecording + 分配 segmentUid + 切到 recording 状态
 *   - pause: finishAndPause + 切到 paused 状态
 *   - resume: 分配新 segmentUid + 切到 recording 状态
 *   - stop:  finishAndStop（切最后 segment + complete）+ 清状态
 *
 * 3a 不做：
 *   - rrweb 集成（v1 recorder.js 继续工作，3c 接入）
 *   - 自动切 segment trigger（10 分钟 / 切 tab / 不活跃）
 *   - 持久化 recordingUid（阶段 4 接入）
 *
 * 3a 的 "events" 暂用 "[]"（空 rrweb 事件）。
 * 阶段 3c 接入 rrweb 后,start/pause 时分别启动/停止 rrweb 并 emit 到 events buffer。
 */

import { logger } from "@/common/logger";
import { createRecording } from "./api";
import { finishAndPause, finishAndStop, generateSegmentUid } from "./lifecycle";
import { getState, updateState, resetState } from "./state";
import { getAuthInfo } from "./auth";
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
		const { uid } = await createRecording(auth, {
			name: formatRecordingName(),
			enterUrl: window.location.href,
		});
		updateState({
			status: "recording",
			recordingUid: uid,
			currentSegmentUid: generateSegmentUid(),
			currentSegmentStartTime: Date.now(),
			recordingStartedAt: Date.now(),
			totalPausedMs: 0,
		});
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

	try {
		await finishAndPause(
			{ ...auth, recordingUid },
			{
				segmentUid: currentSegmentUid,
				events: "[]", // 3a 暂用空 buffer，3c 接入 rrweb
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
		logger.cs.info("pause: segment 已上传");
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
		pushStateToPopup();
		return;
	}

	if (recordingUid && currentSegmentUid && currentSegmentStartTime) {
		// 有当前 segment：finishAndStop（切最后 segment + complete）
		try {
			await finishAndStop(
				{ ...auth, recordingUid },
				{
					segmentUid: currentSegmentUid,
					events: "[]", // 3a 暂用空 buffer
					startTime: currentSegmentStartTime,
					endTime: Date.now(),
					pageUrls: [window.location.href],
				},
			);
			updateState({ segmentCount: segmentCount + 1 });
			logger.cs.info("stop: recording completed");
		} catch (e) {
			logger.cs.error("stop: 失败", e);
			// 仍清本地状态（避免卡住）
		}
	} else if (recordingUid) {
		// paused 状态停止：只调 complete（不切 segment）
		const { completeRecording } = await import("./api");
		try {
			await completeRecording(auth, { recordingUid });
			logger.cs.info("stop: paused → complete");
		} catch (e) {
			logger.cs.error("stop: complete 失败", e);
		}
	}

	resetState();
	pushStateToPopup();
}
