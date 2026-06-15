/**
 * PendingView - 等待上传
 */

import { Upload, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PendingViewProps {
	segmentCount: number;
	onUpload: () => void;
	onClear?: () => void;
}

export function PendingView({
	segmentCount,
	onUpload,
	onClear,
}: PendingViewProps) {
	return (
		<div className="flex flex-col gap-4 p-4 animate-fade-in">
			<Card className="p-4">
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<Badge variant="warning" className="gap-1.5 px-3 py-1">
							<Clock className="w-3.5 h-3.5" />
							待上传
						</Badge>
					</div>

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
								状态
							</span>
							<span className="font-semibold text-[#f59e0b]">等待上传</span>
						</div>
					</div>
				</div>
			</Card>

			<div className="flex gap-2">
				<Button onClick={onUpload} variant="success" className="flex-1 gap-2">
					<Upload className="w-4 h-4" />
					上传
				</Button>

				{onClear && (
					<Button
						onClick={onClear}
						variant="destructive"
						className="flex-1 gap-2"
					>
						<Trash2 className="w-4 h-4" />
						清除
					</Button>
				)}
			</div>
		</div>
	);
}
