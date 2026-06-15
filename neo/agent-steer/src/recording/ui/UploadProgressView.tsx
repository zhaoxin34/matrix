/**
 * UploadProgressView - 上传进度
 */

import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { UploadProgress } from "../types";

interface UploadProgressViewProps {
	progress: UploadProgress | null;
	onCancel: () => void;
}

export function UploadProgressView({
	progress,
	onCancel,
}: UploadProgressViewProps) {
	const percentage = progress?.progress ?? 0;
	const status = progress?.status ?? "uploading";
	const error = progress?.error;

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
								{status === "failed" ? "上传失败" : "上传中..."}
							</span>
						</div>
						<span className="text-sm font-mono font-semibold text-[#1d9bf0]">
							{percentage}%
						</span>
					</div>

					<div className="h-2 rounded-full bg-[#2f3336] overflow-hidden">
						<div
							className={`h-full rounded-full transition-all duration-300 ease-out ${
								status === "failed" ? "bg-red-500" : "bg-[#1d9bf0]"
							}`}
							style={{ width: `${percentage}%` }}
						/>
					</div>

					{error && <p className="text-xs text-red-400">{error}</p>}
				</div>
			</Card>

			<Button variant="secondary" onClick={onCancel} className="w-full gap-2">
				<X className="w-4 h-4" />
				取消上传
			</Button>
		</div>
	);
}
