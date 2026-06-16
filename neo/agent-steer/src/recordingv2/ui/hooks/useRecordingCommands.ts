/**
 * v2 录制命令 Hook
 *
 * 3a：popup → active tab 的 CS 直接发命令（chrome.tabs.sendMessage）。
 * 不经过 SW（v2 SW 仍是极薄壳，不参与录制逻辑）。
 */

import { useCallback } from "react";
import { logger } from "@/common/logger";

const COMMAND_TYPES = {
	start: "recording.start",
	pause: "recording.pause",
	resume: "recording.resume",
	stop: "recording.stop",
} as const;

export interface CommandResult {
	success: boolean;
	error?: string;
}

async function getActiveTabId(): Promise<number | null> {
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	return tab?.id ?? null;
}

async function sendCommand(
	type: (typeof COMMAND_TYPES)[keyof typeof COMMAND_TYPES],
): Promise<CommandResult> {
	const tabId = await getActiveTabId();
	if (!tabId) {
		logger.ui.warn("v2: 无 active tab");
		return { success: false, error: "No active tab" };
	}
	try {
		const response = await chrome.tabs.sendMessage(tabId, { type });
		return response ?? { success: true };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logger.ui.error("v2: 命令发送失败", { type, error: msg });
		return { success: false, error: msg };
	}
}

export function useRecordingCommands(): {
	start: () => Promise<CommandResult>;
	pause: () => Promise<CommandResult>;
	resume: () => Promise<CommandResult>;
	stop: () => Promise<CommandResult>;
} {
	const start = useCallback(async () => {
		logger.ui.info("v2:start");
		return sendCommand(COMMAND_TYPES.start);
	}, []);

	const pause = useCallback(async () => {
		logger.ui.info("v2:pause");
		return sendCommand(COMMAND_TYPES.pause);
	}, []);

	const resume = useCallback(async () => {
		logger.ui.info("v2:resume");
		return sendCommand(COMMAND_TYPES.resume);
	}, []);

	const stop = useCallback(async () => {
		logger.ui.info("v2:stop");
		return sendCommand(COMMAND_TYPES.stop);
	}, []);

	return { start, pause, resume, stop };
}
