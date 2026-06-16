/**
 * v2 录制命令 Hook（Stub）
 *
 * 当前阶段：内部调 v1 recordingActions（仍走 v1 的 SW 中转）。
 * 后续阶段：替换为 v2 自有命令通道（chrome.tabs.sendMessage 直连 CS）。
 *
 * Stub 的目标：固定 v2 命令接口的形态（start/pause/resume/stop），
 * 后续只换实现、不动接口。
 */

import { useCallback } from "react";
import { logger } from "@/common/logger";
import {
	startRecording,
	pauseRecording,
	resumeRecording,
	stopRecording,
} from "@/src/recording";

export interface UseRecordingCommandsReturn {
	start: () => Promise<void>;
	pause: () => Promise<void>;
	resume: () => Promise<void>;
	stop: () => Promise<void>;
}

export function useRecordingCommands(): UseRecordingCommandsReturn {
	const start = useCallback(async () => {
		logger.ui.info("v2:start");
		const result = await startRecording();
		if (!result.success) {
			logger.ui.error("v2:start 失败", result.error);
		}
	}, []);

	const pause = useCallback(async () => {
		logger.ui.info("v2:pause");
		const result = await pauseRecording();
		if (!result.success) {
			logger.ui.error("v2:pause 失败", result.error);
		}
	}, []);

	const resume = useCallback(async () => {
		logger.ui.info("v2:resume");
		const result = await resumeRecording();
		if (!result.success) {
			logger.ui.error("v2:resume 失败", result.error);
		}
	}, []);

	const stop = useCallback(async () => {
		logger.ui.info("v2:stop");
		const result = await stopRecording();
		if (!result.success) {
			logger.ui.error("v2:stop 失败", result.error);
		}
	}, []);

	return { start, pause, resume, stop };
}
