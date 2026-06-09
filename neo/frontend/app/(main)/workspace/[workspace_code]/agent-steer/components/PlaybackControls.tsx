"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { PlaybackState } from "../types";
import { formatDuration } from "../types";
import { StatusDisplay } from "./StatusDisplay";
import { Play, Pause, Square, RotateCcw } from "lucide-react";

interface PlaybackControlsProps {
	playbackState: PlaybackState;
	currentTime: number;
	totalTime: number;
	currentAction?: string;
	onPlay: () => void;
	onPause: () => void;
	onResume: () => void;
	onStop: () => void;
	onSeek: (progress: number) => void;
}

export function PlaybackControls({
	playbackState,
	currentTime,
	totalTime,
	currentAction,
	onPlay,
	onPause,
	onResume,
	onStop,
	onSeek,
}: PlaybackControlsProps) {
	const progress = totalTime > 0 ? (currentTime / totalTime) * 100 : 0;

	const isIdle = playbackState === "idle";
	const isPlaying = playbackState === "playing";
	const isPaused = playbackState === "paused";

	const handleSeek = (values: number[]) => {
		onSeek(values[0]);
	};

	return (
		<div className="space-y-3">
			{/* 标题 */}
			<div className="flex items-center gap-2">
				<span className="text-sm">🎥 指导模式</span>
				<StatusDisplay status={isIdle ? "idle" : "playing"} />
			</div>

			{/* Player 容器（模拟） */}
			<div className="relative bg-muted rounded-md overflow-hidden aspect-video flex items-center justify-center">
				{/* 模拟 rrweb Player */}
				<div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900" />
				<div className="relative z-10 text-center">
					<div className="text-4xl mb-2">📹</div>
					<div className="text-xs text-muted-foreground">rrweb Player</div>
				</div>

				{/* 播放中的指示 */}
				{isPlaying && (
					<div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
						▶ 播放中
					</div>
				)}
			</div>

			{/* 进度条 */}
			<div className="space-y-1">
				<Slider
					value={[progress]}
					max={100}
					step={1}
					onValueChange={handleSeek}
					disabled={isIdle}
					className="cursor-pointer"
				/>
				<div className="flex justify-between text-xs text-muted-foreground">
					<span>{formatDuration(currentTime)}</span>
					<span>{formatDuration(totalTime)}</span>
				</div>
			</div>

			{/* 控制按钮 */}
			<div className="flex items-center gap-2">
				{isIdle && (
					<Button
						variant="default"
						size="sm"
						onClick={onPlay}
						className="gap-1.5"
					>
						<Play className="w-4 h-4" />
						开始回放
					</Button>
				)}

				{(isPlaying || isPaused) && (
					<>
						{isPlaying ? (
							<Button
								variant="outline"
								size="sm"
								onClick={onPause}
								className="gap-1.5"
							>
								<Pause className="w-4 h-4" />
								暂停
							</Button>
						) : (
							<Button
								variant="default"
								size="sm"
								onClick={onResume}
								className="gap-1.5"
							>
								<Play className="w-4 h-4" />
								继续
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							onClick={onStop}
							className="gap-1.5"
						>
							<Square className="w-4 h-4 fill-current" />
							停止
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onSeek(0)}
							className="gap-1.5"
						>
							<RotateCcw className="w-4 h-4" />
							重播
						</Button>
					</>
				)}
			</div>

			{/* 当前操作描述 */}
			{currentAction && (
				<div className="bg-muted/50 rounded-md p-2 text-xs">
					<span className="text-muted-foreground">当前操作: </span>
					<span className="font-medium">{currentAction}</span>
				</div>
			)}
		</div>
	);
}
