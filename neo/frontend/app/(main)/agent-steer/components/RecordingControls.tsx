"use client";

import { Button } from "@/components/ui/button";
import type { RecordingState } from "../types";
import { formatDuration } from "../types";
import { StatusDisplay } from "./StatusDisplay";
import { Play, Pause, Square } from "lucide-react";

interface RecordingControlsProps {
	recordingState: RecordingState;
	duration: number;
	eventCount: number;
	onStart: () => void;
	onPause: () => void;
	onResume: () => void;
	onStop: () => void;
}

export function RecordingControls({
	recordingState,
	duration,
	eventCount,
	onStart,
	onPause,
	onResume,
	onStop,
}: RecordingControlsProps) {
	const isIdle = recordingState === "idle";
	const isRecording = recordingState === "recording";
	const isPaused = recordingState === "paused";

	return (
		<div className="space-y-3">
			{/* 标题 */}
			<div className="flex items-center gap-2">
				<span className="text-sm">🎬 学习模式</span>
				<StatusDisplay status={isIdle ? "idle" : recordingState} />
			</div>

			{/* 录制时长和事件计数 */}
			<div className="flex items-center justify-between text-sm">
				<div className="flex items-center gap-4">
					<span className="font-mono text-base tabular-nums">
						{formatDuration(duration)}
					</span>
				</div>
				<span className="text-muted-foreground">
					事件:{" "}
					<span className="font-medium text-foreground">{eventCount}</span>
				</span>
			</div>

			{/* 控制按钮 */}
			<div className="flex items-center gap-2">
				{/* 开始按钮 */}
				{isIdle && (
					<Button
						variant="default"
						size="sm"
						onClick={onStart}
						className="gap-1.5"
					>
						<Play className="w-4 h-4" />
						开始
					</Button>
				)}

				{/* 录制中：显示暂停和停止 */}
				{isRecording && (
					<>
						<Button
							variant="outline"
							size="sm"
							onClick={onPause}
							className="gap-1.5"
						>
							<Pause className="w-4 h-4" />
							暂停
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={onStop}
							className="gap-1.5 text-destructive hover:text-destructive"
						>
							<Square className="w-4 h-4 fill-current" />
							停止
						</Button>
					</>
				)}

				{/* 暂停中：显示恢复和停止 */}
				{isPaused && (
					<>
						<Button
							variant="default"
							size="sm"
							onClick={onResume}
							className="gap-1.5"
						>
							<Play className="w-4 h-4" />
							恢复
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={onStop}
							className="gap-1.5 text-destructive hover:text-destructive"
						>
							<Square className="w-4 h-4 fill-current" />
							停止
						</Button>
					</>
				)}
			</div>

			{/* 录制指示器 */}
			{isRecording && (
				<div className="flex items-center gap-2 text-xs text-green-600">
					<span className="relative flex h-2 w-2">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
						<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
					</span>
					正在录制...
				</div>
			)}
		</div>
	);
}
