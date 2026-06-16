/**
 * IdleView - 空闲状态（v2）
 */

import { Circle, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface IdleViewProps {
	onStart: () => void;
}

export function IdleView({ onStart }: IdleViewProps) {
	return (
		<div className="flex flex-col gap-4 p-4 animate-fade-in">
			<Card className="p-5 border-white/5">
				<div className="flex flex-col gap-4 items-center text-center">
					<div className="w-16 h-16 rounded-2xl bg-[#f4212e]/10 flex items-center justify-center relative">
						<CircleDot className="w-8 h-8 text-[#f4212e]" />
						<div className="absolute inset-0 rounded-2xl border border-[#f4212e]/20" />
					</div>
					<div className="space-y-1">
						<h3 className="font-semibold text-[#e7e9ea]">准备就绪</h3>
						<p className="text-xs text-[#8b98a5]">点击开始录制您的操作</p>
					</div>
				</div>
			</Card>

			<Button
				onClick={onStart}
				variant="destructive"
				size="lg"
				className="w-full gap-2 text-base font-semibold"
			>
				<Circle className="w-5 h-5 fill-current" />
				开始录制
			</Button>

			<p className="text-xs text-center text-[#8b98a5] pb-2">
				录制可跨 tab 持续跟踪您的所有操作
			</p>
		</div>
	);
}
