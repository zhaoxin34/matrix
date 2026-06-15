/**
 * CS 录制命令处理
 */

import type { CommandParams, RRWebResult } from "./types";
import {
	notifyStateChange,
	pushCommandResponseToPopup,
	tickDuration,
	resetState,
} from "./state";
import { sendToRRWeb } from "./rrweb";
import { logger } from "@/common/logger";

/** 定时器 ID */
let updateTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 开始定时器，每秒更新录制时长
 */
function startUpdateTimer(): void {
	if (updateTimer) return;

	logger.cs.debug("开始录制时长更新定时器");
	updateTimer = setInterval(() => {
		tickDuration();
	}, 1000);
}

/**
 * 停止定时器
 */
function stopUpdateTimer(): void {
	if (updateTimer) {
		clearInterval(updateTimer);
		updateTimer = null;
		logger.cs.debug("停止录制时长更新定时器");
	}
}

/**
 * 处理 start 命令
 */
async function handleStart(params: CommandParams): Promise<void> {
	const { requestId } = params;

	try {
		const result = (await sendToRRWeb("start")) as RRWebResult;
		logger.cs.info("start 命令响应:", result);

		if (result.success && result.sessionId) {
			logger.cs.info("start 成功，更新状态为 recording");
			notifyStateChange({
				status: "recording",
				sessionId: result.sessionId,
				startTime: Date.now(),
				duration: 0,
			});
			startUpdateTimer();
			pushCommandResponseToPopup(requestId, "start", true, result.sessionId);
		} else if (result.error === "Already recording") {
			// 已经在录制，尝试获取当前状态并同步
			logger.cs.info("已经在录制，同步状态");
			const stateResult = (await sendToRRWeb("status")) as RRWebResult;
			if (stateResult.success && stateResult.isRecording) {
				notifyStateChange({
					status: stateResult.isPaused ? "paused" : "recording",
					sessionId: stateResult.sessionId,
				});
				if (!stateResult.isPaused) {
					startUpdateTimer();
				}
			}
			pushCommandResponseToPopup(
				requestId,
				"start",
				true,
				stateResult.sessionId,
			);
		} else {
			logger.cs.warn("start 失败:", result.error);
			pushCommandResponseToPopup(
				requestId,
				"start",
				false,
				undefined,
				result.error,
			);
		}
	} catch (e) {
		logger.cs.error("start 命令执行失败:", e);
		pushCommandResponseToPopup(requestId, "start", false, undefined, String(e));
	}
}

/**
 * 处理 pause 命令
 */
async function handlePause(params: CommandParams): Promise<void> {
	const { requestId } = params;

	try {
		await sendToRRWeb("pause");
		notifyStateChange({ status: "paused" });
		pushCommandResponseToPopup(requestId, "pause", true);
	} catch (e) {
		logger.cs.error("pause 命令执行失败:", e);
		pushCommandResponseToPopup(requestId, "pause", false, undefined, String(e));
	}
}

/**
 * 处理 resume 命令
 */
async function handleResume(params: CommandParams): Promise<void> {
	const { requestId } = params;

	try {
		await sendToRRWeb("resume");
		notifyStateChange({ status: "recording" });
		startUpdateTimer();
		pushCommandResponseToPopup(requestId, "resume", true);
	} catch (e) {
		logger.cs.error("resume 命令执行失败:", e);
		pushCommandResponseToPopup(
			requestId,
			"resume",
			false,
			undefined,
			String(e),
		);
	}
}

/**
 * 处理 stop 命令
 */
async function handleStop(params: CommandParams): Promise<void> {
	const { requestId } = params;

	try {
		await sendToRRWeb("stop");
		stopUpdateTimer();
		notifyStateChange({
			status: "pending",
			startTime: undefined,
		});
		pushCommandResponseToPopup(requestId, "stop", true);
	} catch (e) {
		logger.cs.error("stop 命令执行失败:", e);
		pushCommandResponseToPopup(requestId, "stop", false, undefined, String(e));
	}
}

/**
 * 处理 reset 命令（清除录制后重置状态）
 */
async function handleReset(params: CommandParams): Promise<void> {
	const { requestId } = params;
	logger.cs.info("handleReset: 重置 CS 状态并清除 IndexedDB");

	try {
		// 1. 发送 reset 命令重置 recorder 内存状态（停止录制、重置变量）
		await sendToRRWeb("reset");
		// 2. 发送 clear 命令清除 recorder 的 IndexedDB
		await sendToRRWeb("clear");
		// 3. 重置 CS 状态
		stopUpdateTimer();
		resetState();
		pushCommandResponseToPopup(requestId, "reset", true);
	} catch (e) {
		logger.cs.error("reset 命令执行失败:", e);
		pushCommandResponseToPopup(requestId, "reset", false, undefined, String(e));
	}
}

/**
 * 根据命令类型分发处理
 */
export async function handleCommand(params: CommandParams): Promise<void> {
	const { requestId, command } = params;
	logger.cs.info(`处理命令: ${command}, requestId: ${requestId}`);

	switch (command) {
		case "start":
			await handleStart(params);
			break;
		case "pause":
			await handlePause(params);
			break;
		case "resume":
			await handleResume(params);
			break;
		case "stop":
			await handleStop(params);
			break;
		case "reset":
			await handleReset(params);
			break;
		default:
			logger.cs.warn(`未知命令: ${command}`);
			pushCommandResponseToPopup(
				requestId,
				command as "start" | "pause" | "resume" | "stop" | "reset",
				false,
				undefined,
				`Unknown command: ${command}`,
			);
	}
}
