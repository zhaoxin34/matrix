/**
 * RecordingView - 正在录制状态
 */

import { Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecordingViewProps {
	duration: number;
	segmentCount: number;
	onPause: () => void;
	onStop: () => void;
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
	onStop,
}: RecordingViewProps) {
	return (
		<div className="flex flex-col gap-4 p-4 animate-fade-in">
			<Card className="p-4 border-[#f4212e]/20 bg-[#f4212e]/5">
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<Badge variant="destructive" className="gap-1.5 px-3 py-1">
							<span className="w-2 h-2 rounded-full bg-[#f4212e] animate-pulse" />
							录制中
						</Badge>
						<span className="text-3xl font-mono font-bold text-[#e7e9ea] tracking-tight">
							{formatDuration(duration)}
						</span>
					</div>

					<div className="flex items-center gap-4 text-xs text-[#8b98a5]">
						<span className="flex items-center gap-1.5">
							<span className="w-1.5 h-1.5 rounded-full bg-[#8b98a5]" />
							片段: {segmentCount}
						</span>
						<span className="flex items-center gap-1.5">
							<span className="w-1.5 h-1.5 rounded-full bg-[#00c853]" />
							状态正常
						</span>
					</div>
				</div>
			</Card>

			<div className="flex gap-2">
				<Button
					onClick={onPause}
					variant="secondary"
					size="lg"
					className="flex-1 gap-2"
				>
					<Pause className="w-5 h-5" />
					暂停录制
				</Button>
				<Button
					onClick={onStop}
					variant="destructive"
					size="lg"
					className="flex-1 gap-2"
				>
					<Square className="w-5 h-5 fill-current" />
					停止录制
				</Button>
			</div>
		</div>
	);
}
