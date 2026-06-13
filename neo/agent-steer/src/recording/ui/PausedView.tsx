/**
 * PausedView - 暂停状态
 */

import { Play, Upload, CirclePause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PausedViewProps {
	duration: number;
	segmentCount: number;
	onResume: () => void;
	onUpload: () => void;
	hideUpload?: boolean;
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

export function PausedView({
	duration,
	segmentCount,
	onResume,
	onUpload,
	hideUpload = false,
}: PausedViewProps) {
	return (
		<div className="flex flex-col gap-4 p-4 animate-fade-in">
			<Card className="p-4">
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<Badge variant="warning" className="gap-1.5 px-3 py-1">
							<CirclePause className="w-3.5 h-3.5" />
							已暂停
						</Badge>
						<span className="text-2xl font-mono font-bold text-[#e7e9ea]">
							{formatDuration(duration)}
						</span>
					</div>

					<div className="h-px bg-white/5" />

					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-[#2f3336]/30">
							<span className="text-[10px] text-[#8b98a5] uppercase tracking-wide">
								片段数
							</span>
							<span className="font-semibold text-[#e7e9ea]">
								{segmentCount}
							</span>
						</div>
						<div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-[#2f3336]/30">
							<span className="text-[10px] text-[#8b98a5] uppercase tracking-wide">
								录制时长
							</span>
							<span className="font-semibold text-[#e7e9ea]">
								{formatDuration(duration)}
							</span>
						</div>
					</div>
				</div>
			</Card>

			<div className="flex flex-col gap-2">
				<Button onClick={onResume} size="lg" className="w-full gap-2">
					<Play className="w-4 h-4" />
					继续录制
				</Button>

				{!hideUpload && (
					<Button onClick={onUpload} variant="success" className="w-full gap-2">
						<Upload className="w-4 h-4" />
						上传录像
					</Button>
				)}
			</div>
		</div>
	);
}
