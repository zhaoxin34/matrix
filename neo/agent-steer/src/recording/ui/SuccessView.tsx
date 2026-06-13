/**
 * SuccessView - 上传成功
 */

import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SuccessViewProps {
	onViewPlayback: () => void;
}

export function SuccessView({ onViewPlayback }: SuccessViewProps) {
	return (
		<div className="flex flex-col gap-4 p-4 animate-fade-in">
			<Card className="p-5 border-[#00c853]/20 bg-[#00c853]/5">
				<div className="flex flex-col gap-4 items-center text-center">
					<div className="w-14 h-14 rounded-2xl bg-[#00c853]/10 flex items-center justify-center relative">
						<CheckCircle2 className="w-8 h-8 text-[#00c853]" />
					</div>
					<div className="space-y-1">
						<h3 className="font-semibold text-[#00c853]">上传成功</h3>
						<p className="text-xs text-[#8b98a5]">录像已成功保存到服务器</p>
					</div>
				</div>
			</Card>

			<Button onClick={onViewPlayback} className="w-full gap-2" size="lg">
				查看回放
				<ArrowRight className="w-4 h-4" />
			</Button>

			<p className="text-xs text-center text-[#8b98a5] pb-2">
				点击按钮在新窗口中查看录像回放
			</p>
		</div>
	);
}
