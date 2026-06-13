/**
 * LoadingView - 加载中
 */

import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function LoadingView() {
	return (
		<div className="flex flex-col gap-4 p-4">
			<Card className="p-6 flex flex-col items-center gap-3">
				<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
				<p className="text-sm text-muted-foreground">加载中...</p>
			</Card>
		</div>
	);
}
