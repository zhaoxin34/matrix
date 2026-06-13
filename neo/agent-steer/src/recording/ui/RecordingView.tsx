/**
 * RecordingView - 正在录制状态
 */

import React from "react";
import { Pause, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecordingViewProps {
	duration: number;
	segmentCount: number;
	onPause: () => void;
}

function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
	}
	return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function RecordingView({
	duration,
	segmentCount,
	onPause,
}: RecordingViewProps) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<Card className="p-4 border-red-500/20 bg-red-500/5">
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Badge variant="destructive" className="gap-1 animate-pulse">
								<CircleDot className="w-3 h-3 fill-current" />
								录制中
							</Badge>
							<span className="text-2xl font-mono font-bold text-foreground">
								{formatDuration(duration)}
							</span>
						</div>
					</div>

					<div className="flex items-center gap-4 text-xs text-muted-foreground">
						<span>片段: {segmentCount}</span>
						<span>状态: 正常</span>
					</div>
				</div>
			</Card>

			<Button
				onClick={onPause}
				variant="outline"
				size="lg"
				className="w-full gap-2"
			>
				<Pause className="w-5 h-5" />
				暂停录制
			</Button>
		</div>
	);
}
