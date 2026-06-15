/**
 * 录制状态 Hook
 */

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/common/logger";
import type { RecordingState, CSToPopupMessage } from "../../types";
import {
	startRecording as swStartRecording,
	pauseRecording as swPauseRecording,
	resumeRecording as swResumeRecording,
	stopRecording as swStopRecording,
	getRecordingState as getSWRecordingState,
	clearRecording as swClearRecording,
	addStateListener,
} from "../../index";

const DEFAULT_STATE: RecordingState = {
	isRecording: false,
	isPaused: false,
	duration: 0,
	segmentCount: 0,
	eventCount: 0,
};

interface RecordingStateData {
	isRecording: boolean;
	isPaused: boolean;
	duration: number;
	segmentCount: number;
	eventCount: number;
}

interface UseRecordingStateReturn {
	recordingState: RecordingState;
	clearRecording: () => Promise<void>;
}

export function useRecordingState(): UseRecordingStateReturn {
	const [recordingState, setRecordingState] =
		useState<RecordingState>(DEFAULT_STATE);

	// 初始化时获取录制状态
	useEffect(() => {
		const init = async () => {
			try {
				const state = (await getSWRecordingState()) as RecordingStateData;
				setRecordingState({
					isRecording: state.isRecording,
					isPaused: state.isPaused,
					duration: state.duration,
					segmentCount: state.segmentCount,
					eventCount: state.eventCount,
				});
			} catch (e) {
				logger.ui.error("useRecordingState: 获取状态失败", e);
			}
		};
		init();
	}, []);

	// 监听 CS 推送
	useEffect(() => {
		const unsubscribe = addStateListener((state) => {
			setRecordingState(state);
		});

		const messageListener = (message: unknown) => {
			const msg = message as CSToPopupMessage;
			if (msg?.direction === "cs→popup" && msg.type === "state-update") {
				setRecordingState({
					isRecording: msg.state.isRecording,
					isPaused: msg.state.isPaused,
					duration: msg.state.duration,
					segmentCount: msg.state.segmentCount,
					eventCount: msg.state.eventCount,
					sessionId: msg.state.sessionId ?? undefined,
				});
			}
		};

		chrome.runtime.onMessage.addListener(messageListener);
		return () => {
			unsubscribe();
			chrome.runtime.onMessage.removeListener(messageListener);
		};
	}, []);

	const clearRecording = useCallback(async () => {
		logger.ui.info("clearRecording: 清除录制数据");
		const result = await swClearRecording();
		if (result.success) {
			setRecordingState(DEFAULT_STATE);
			logger.ui.debug("clearRecording: 成功");
		} else {
			logger.ui.error("clearRecording: 失败", result.error);
		}
	}, []);

	return { recordingState, clearRecording };
}

// 录制操作（独立导出，方便其他地方使用）
export const recordingActions = {
	startRecording: swStartRecording,
	pauseRecording: swPauseRecording,
	resumeRecording: swResumeRecording,
	stopRecording: swStopRecording,
};
