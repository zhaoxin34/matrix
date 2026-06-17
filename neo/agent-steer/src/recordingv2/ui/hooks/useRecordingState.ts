/**
 * v2 录制状态 Hook
 *
 * 3a：监听 chrome.runtime.onMessage 拿 CS 推的 state-update。
 * duration 由 hook 端用 setInterval 实时算（基于 CS 推的 recordingStartedAt / totalPausedMs / pausedAt）。
 */

import { useState, useEffect } from "react";
import { logger } from "@/common/logger";
import { getAuthUserInfo, getConfig } from "@/common/storage";
import type { V2Status } from "../../types";

interface V2StateFromCS {
	status: V2Status;
	recordingUid?: string;
	recordingName?: string;
	currentSegmentUid?: string;
	recordingStartedAt?: number;
	totalPausedMs: number;
	pausedAt?: number;
	segmentCount: number;
	duration: number; // ms, hook 端算
	workspaceCode?: string;
	frontendUrl?: string;
}

const DEFAULT_STATE: V2StateFromCS = {
	status: "idle",
	recordingUid: undefined,
	recordingName: undefined,
	currentSegmentUid: undefined,
	recordingStartedAt: undefined,
	totalPausedMs: 0,
	pausedAt: undefined,
	segmentCount: 0,
	duration: 0,
	workspaceCode: undefined,
	frontendUrl: undefined,
};

function computeDuration(
	recordingStartedAt: number | undefined,
	totalPausedMs: number,
	pausedAt: number | undefined,
): number {
	if (!recordingStartedAt) return 0;
	const now = pausedAt ?? Date.now();
	return Math.max(0, now - recordingStartedAt - totalPausedMs);
}

interface StateUpdateMessage {
	type: string;
	state: Omit<V2StateFromCS, "duration">;
}

export function useRecordingState(): { state: V2StateFromCS } {
	const [state, setState] = useState<V2StateFromCS>(DEFAULT_STATE);

	// 监听 CS 推 state
	useEffect(() => {
		const listener = (message: unknown) => {
			const m = message as Partial<StateUpdateMessage> | undefined;
			if (m?.type !== "recording.state-update" || !m.state) return;
			logger.ui.debug("v2: state-update", m.state);
			const csState = m.state;
			setState((prev) => ({
				...prev,
				status: csState.status,
				recordingUid: csState.recordingUid,
				recordingName: csState.recordingName ?? prev.recordingName,
				currentSegmentUid: csState.currentSegmentUid,
				recordingStartedAt: csState.recordingStartedAt,
				totalPausedMs: csState.totalPausedMs ?? 0,
				pausedAt: csState.pausedAt,
				segmentCount: csState.segmentCount ?? prev.segmentCount,
			}));
		};
		chrome.runtime.onMessage.addListener(listener);
		return () => {
			chrome.runtime.onMessage.removeListener(listener);
		};
	}, []);

	// 初始化 workspaceCode 和 frontendUrl
	useEffect(() => {
		Promise.all([getAuthUserInfo(), getConfig()]).then(([info, cfg]) => {
			const userInfo = info as { workspaceCode?: string } | null;
			setState((prev) => ({
				...prev,
				workspaceCode: userInfo?.workspaceCode ?? prev.workspaceCode,
				frontendUrl: cfg.neoUrl,
			}));
		});
	}, []);

	// 实时算 duration
	useEffect(() => {
		if (state.status !== "recording") {
			setState((prev) =>
				prev.duration === 0 ? prev : { ...prev, duration: 0 },
			);
			return;
		}
		const tick = () => {
			const d = computeDuration(
				state.recordingStartedAt,
				state.totalPausedMs,
				state.pausedAt,
			);
			setState((prev) =>
				prev.duration === d ? prev : { ...prev, duration: d },
			);
		};
		tick();
		const interval = setInterval(tick, 1000);
		return () => clearInterval(interval);
	}, [
		state.status,
		state.recordingStartedAt,
		state.totalPausedMs,
		state.pausedAt,
	]);

	return { state };
}
