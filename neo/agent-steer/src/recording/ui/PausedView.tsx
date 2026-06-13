/**
 * PausedView - 暂停状态
 */

import React from "react";
import { Play, Upload, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
		<div className="flex flex-col gap-4 p-4">
			<Card className="p-4">
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<Badge variant="secondary" className="gap-1">
							<CircleDot className="w-3 h-3" />
							已暂停
						</Badge>
						<span className="text-xl font-mono font-bold">
							{formatDuration(duration)}
						</span>
					</div>

					<Separator />

					<div className="grid grid-cols-2 gap-2 text-sm">
						<div className="flex flex-col">
							<span className="text-muted-foreground text-xs">片段数</span>
							<span className="font-medium">{segmentCount}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-muted-foreground text-xs">录制时长</span>
							<span className="font-medium">{formatDuration(duration)}</span>
						</div>
					</div>
				</div>
			</Card>

			<div className="flex flex-col gap-2">
				<Button onClick={onResume} className="w-full gap-2">
					<Play className="w-4 h-4" />
					继续录制
				</Button>

				{!hideUpload && (
					<Button onClick={onUpload} variant="outline" className="w-full gap-2">
						<Upload className="w-4 h-4" />
						上传录像
					</Button>
				)}
			</div>
		</div>
	);
}
