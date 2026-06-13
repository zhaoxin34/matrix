/**
 * UploadPanel - 上传进度
 */

import React from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UploadPanelProps {
	progress: number;
	onCancel: () => void;
}

export function UploadPanel({ progress, onCancel }: UploadPanelProps) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<Card className="p-4">
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Upload className="w-4 h-4 text-muted-foreground" />
							<span className="text-sm font-medium">上传中...</span>
						</div>
						<span className="text-sm text-muted-foreground">{progress}%</span>
					</div>

					<Progress value={progress} className="h-2" />
				</div>
			</Card>

			<Button variant="outline" onClick={onCancel} className="w-full gap-2">
				<X className="w-4 h-4" />
				取消上传
			</Button>
		</div>
	);
}
