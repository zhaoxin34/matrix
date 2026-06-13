/**
 * PendingView - 等待上传
 */

import React from "react";
import { Upload, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PendingViewProps {
	segmentCount: number;
	onUpload: () => void;
}

export function PendingView({ segmentCount, onUpload }: PendingViewProps) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<Card className="p-4">
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="gap-1">
							<CircleDot className="w-3 h-3" />
							待上传
						</Badge>
					</div>

					<div className="grid grid-cols-2 gap-2 text-sm">
						<div className="flex flex-col p-2 bg-muted/50 rounded">
							<span className="text-muted-foreground text-xs">片段数</span>
							<span className="font-medium">{segmentCount}</span>
						</div>
						<div className="flex flex-col p-2 bg-muted/50 rounded">
							<span className="text-muted-foreground text-xs">状态</span>
							<span className="font-medium text-amber-600 dark:text-amber-400">
								等待上传
							</span>
						</div>
					</div>
				</div>
			</Card>

			<Button onClick={onUpload} className="w-full gap-2">
				<Upload className="w-4 h-4" />
				上传录像
			</Button>
		</div>
	);
}
