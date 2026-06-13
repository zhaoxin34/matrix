/**
 * UploadPanel - 上传进度
 */

import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UploadPanelProps {
	progress: number;
	onCancel: () => void;
}

export function UploadPanel({ progress, onCancel }: UploadPanelProps) {
	return (
		<div className="flex flex-col gap-4 p-4 animate-fade-in">
			<Card className="p-4">
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-lg bg-[#1d9bf0]/10 flex items-center justify-center">
								<Upload className="w-4 h-4 text-[#1d9bf0]" />
							</div>
							<span className="text-sm font-medium text-[#e7e9ea]">
								上传中...
							</span>
						</div>
						<span className="text-sm font-mono font-semibold text-[#1d9bf0]">
							{progress}%
						</span>
					</div>

					<div className="h-2 rounded-full bg-[#2f3336] overflow-hidden">
						<div
							className="h-full rounded-full bg-[#1d9bf0] transition-all duration-300 ease-out"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</Card>

			<Button variant="secondary" onClick={onCancel} className="w-full gap-2">
				<X className="w-4 h-4" />
				取消上传
			</Button>
		</div>
	);
}
