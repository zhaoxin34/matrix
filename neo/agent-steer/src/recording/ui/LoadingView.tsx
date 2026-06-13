/**
 * LoadingView - 加载中
 */

import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function LoadingView() {
	return (
		<div className="flex flex-col gap-4 p-4 animate-fade-in">
			<Card className="p-6 flex flex-col items-center gap-3">
				<div className="w-12 h-12 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center">
					<Loader2 className="w-6 h-6 animate-spin text-[#1d9bf0]" />
				</div>
				<p className="text-sm text-[#8b98a5]">加载中...</p>
			</Card>
		</div>
	);
}
