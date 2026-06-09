"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AgentMode, AgentSteerState } from "../types";

// 初始状态
const initialState: AgentSteerState = {
	mode: "learn",
	recordingState: "idle",
	playbackState: "idle",
	duration: 0,
	eventCount: 0,
	playbackProgress: 0,
	totalDuration: 600, // 10分钟作为默认总时长
	currentAction: undefined,
};

export function useAgentSteer() {
	const [state, setState] = useState<AgentSteerState>(initialState);
	const [isDebugMode, setIsDebugMode] = useState(false);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const eventTimerRef = useRef<NodeJS.Timeout | null>(null);

	// 清理定时器
	const clearTimers = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		if (eventTimerRef.current) {
			clearInterval(eventTimerRef.current);
			eventTimerRef.current = null;
		}
	}, []);

	// 设置模式
	const setMode = useCallback(
		(mode: AgentMode) => {
			clearTimers();
			setState((prev) => ({
				...prev,
				mode,
				// 切换模式时重置录制状态
				recordingState: "idle",
				playbackState: "idle",
				duration: 0,
				eventCount: 0,
				playbackProgress: 0,
				currentAction: undefined,
			}));
		},
		[clearTimers],
	);

	// 开始录制
	const startRecording = useCallback(() => {
		// 启动时长计时器
		timerRef.current = setInterval(() => {
			setState((s) => ({
				...s,
				duration: s.duration + 1,
			}));
		}, 1000);

		// 启动事件计数器（模拟）
		eventTimerRef.current = setInterval(() => {
			setState((s) => ({
				...s,
				eventCount: s.eventCount + Math.floor(Math.random() * 3) + 1,
			}));
		}, 2000);

		setState((prev) => ({
			...prev,
			recordingState: "recording",
			duration: 0,
			eventCount: 0,
		}));
	}, []);

	// 暂停录制
	const pauseRecording = useCallback(() => {
		clearTimers();
		setState((prev) => ({
			...prev,
			recordingState: "paused",
		}));
	}, [clearTimers]);

	// 恢复录制
	const resumeRecording = useCallback(() => {
		clearTimers();
		timerRef.current = setInterval(() => {
			setState((s) => ({
				...s,
				duration: s.duration + 1,
			}));
		}, 1000);

		eventTimerRef.current = setInterval(() => {
			setState((s) => ({
				...s,
				eventCount: s.eventCount + Math.floor(Math.random() * 3) + 1,
			}));
		}, 2000);

		setState((prev) => ({
			...prev,
			recordingState: "recording",
		}));
	}, [clearTimers]);

	// 停止录制
	const stopRecording = useCallback(() => {
		clearTimers();
		setState((prev) => ({
			...prev,
			recordingState: "idle",
		}));
	}, [clearTimers]);

	// 开始回放
	const startPlayback = useCallback(() => {
		setState((prev) => ({
			...prev,
			playbackState: "playing",
			playbackProgress: 0,
			currentAction: "开始回放...",
		}));

		// 模拟回放进度
		const playbackInterval = setInterval(() => {
			setState((s) => {
				const newProgress = s.playbackProgress + 1;
				if (newProgress >= 100) {
					clearInterval(playbackInterval);
					return {
						...s,
						playbackState: "idle",
						playbackProgress: 0,
						currentAction: "回放完成",
					};
				}

				// 模拟当前操作描述
				const actions = [
					"点击了「登录」按钮",
					"输入了用户名",
					"输入了密码",
					"点击了「提交」按钮",
					"页面跳转到首页",
					"打开了侧边菜单",
					"点击了「设置」链接",
				];
				const randomAction =
					actions[Math.floor(Math.random() * actions.length)];

				return {
					...s,
					playbackProgress: newProgress,
					currentAction: randomAction,
				};
			});
		}, 100);
	}, []);

	// 暂停回放
	const pausePlayback = useCallback(() => {
		setState((prev) => ({
			...prev,
			playbackState: "paused",
		}));
	}, []);

	// 恢复回放
	const resumePlayback = useCallback(() => {
		setState((prev) => ({
			...prev,
			playbackState: "playing",
		}));
	}, []);

	// 停止回放
	const stopPlayback = useCallback(() => {
		setState((prev) => ({
			...prev,
			playbackState: "idle",
			playbackProgress: 0,
			currentAction: undefined,
		}));
	}, []);

	// 跳转回放
	const seekPlayback = useCallback((progress: number) => {
		setState((prev) => ({
			...prev,
			playbackProgress: Math.max(0, Math.min(100, progress)),
		}));
	}, []);

	// 切换调试模式
	const toggleDebugMode = useCallback(() => {
		setIsDebugMode((prev) => !prev);
	}, []);

	// 清理
	useEffect(() => {
		return () => {
			clearTimers();
		};
	}, [clearTimers]);

	return {
		// 状态
		state,
		isDebugMode,

		// 模式操作
		setMode,

		// 录制操作
		startRecording,
		pauseRecording,
		resumeRecording,
		stopRecording,

		// 回放操作
		startPlayback,
		pausePlayback,
		resumePlayback,
		stopPlayback,
		seekPlayback,

		// 调试
		toggleDebugMode,
	};
}

// 导出类型供组件使用
export type UseAgentSteerReturn = ReturnType<typeof useAgentSteer>;
