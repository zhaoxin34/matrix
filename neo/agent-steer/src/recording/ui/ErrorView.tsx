/**
 * ErrorView - 上传失败
 */

import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ErrorViewProps {
	error: string;
	onRetry: () => void;
	onCancel: () => void;
}

export function ErrorView({ error, onRetry, onCancel }: ErrorViewProps) {
	return (
		<div className="flex flex-col gap-4 p-4 animate-fade-in">
			<Card className="p-4 border-[#f4212e]/20 bg-[#f4212e]/5">
				<div className="flex items-start gap-3">
					<div className="w-10 h-10 rounded-lg bg-[#f4212e]/10 flex items-center justify-center shrink-0">
						<AlertTriangle className="w-5 h-5 text-[#f4212e]" />
					</div>
					<div className="flex flex-col gap-1 min-w-0 flex-1">
						<p className="font-medium text-sm text-[#e7e9ea]">上传失败</p>
						<p className="text-xs text-[#8b98a5] opacity-80">{error}</p>
					</div>
				</div>
			</Card>

			<Card className="p-3 bg-[#2f3336]/30">
				<p className="text-xs text-[#8b98a5] text-center">
					请检查网络连接后重试
				</p>
			</Card>

			<div className="flex gap-2">
				<Button variant="secondary" onClick={onCancel} className="flex-1 gap-2">
					<X className="w-4 h-4" />
					取消
				</Button>
				<Button
					variant="destructive"
					onClick={onRetry}
					className="flex-1 gap-2"
				>
					<RotateCcw className="w-4 h-4" />
					重试
				</Button>
			</div>
		</div>
	);
}
