"use client";

import { useAgentSteer } from "../hooks/useAgentSteer";
import { ModeSelector } from "./ModeSelector";
import { RecordingControls } from "./RecordingControls";
import { PlaybackControls } from "./PlaybackControls";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgentSteer() {
	const {
		state,
		isDebugMode,
		setMode,
		startRecording,
		pauseRecording,
		resumeRecording,
		stopRecording,
		startPlayback,
		pausePlayback,
		resumePlayback,
		stopPlayback,
		seekPlayback,
		toggleDebugMode,
	} = useAgentSteer();

	// 根据当前模式显示不同的控制区域
	const showRecordingControls = state.mode === "learn";
	const showPlaybackControls = state.mode === "guide";

	return (
		<div className="w-80 rounded-lg border bg-background shadow-lg overflow-hidden">
			{/* 头部 */}
			<div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
				<div className="flex items-center gap-2">
					<Settings className="w-4 h-4 text-muted-foreground" />
					<span className="text-sm font-medium">Agent Steer</span>
				</div>
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={toggleDebugMode}
					title={isDebugMode ? "隐藏调试" : "显示调试"}
				>
					🐛
				</Button>
			</div>

			{/* 内容区域 */}
			<div className="p-3 space-y-4">
				{/* 模式选择 */}
				<ModeSelector
					value={state.mode}
					onChange={setMode}
					disabled={
						state.recordingState !== "idle" || state.playbackState !== "idle"
					}
				/>

				{/* 分隔线 */}
				<div className="border-t" />

				{/* 学习模式：录制控制 */}
				{showRecordingControls && (
					<RecordingControls
						recordingState={state.recordingState}
						duration={state.duration}
						eventCount={state.eventCount}
						onStart={startRecording}
						onPause={pauseRecording}
						onResume={resumeRecording}
						onStop={stopRecording}
					/>
				)}

				{/* 指导模式：回放控制 */}
				{showPlaybackControls && (
					<PlaybackControls
						playbackState={state.playbackState}
						currentTime={Math.floor(
							(state.playbackProgress / 100) * state.totalDuration,
						)}
						totalTime={state.totalDuration}
						currentAction={state.currentAction}
						onPlay={startPlayback}
						onPause={pausePlayback}
						onResume={resumePlayback}
						onStop={stopPlayback}
						onSeek={seekPlayback}
					/>
				)}

				{/* 主动模式：占位 */}
				{state.mode === "active" && (
					<div className="text-center py-6 text-muted-foreground">
						<div className="text-3xl mb-2">🚀</div>
						<div className="text-sm">主动模式</div>
						<div className="text-xs mt-1">任务管理功能开发中...</div>
					</div>
				)}

				{/* 调试信息 */}
				{isDebugMode && (
					<div className="mt-4 p-2 bg-muted rounded text-xs font-mono space-y-1">
						<div className="font-bold">调试信息</div>
						<div>模式: {state.mode}</div>
						<div>录制状态: {state.recordingState}</div>
						<div>回放状态: {state.playbackState}</div>
						<div>时长: {state.duration}s</div>
						<div>事件: {state.eventCount}</div>
						<div>回放进度: {state.playbackProgress.toFixed(1)}%</div>
					</div>
				)}
			</div>
		</div>
	);
}
