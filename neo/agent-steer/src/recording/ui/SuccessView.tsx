/**
 * SuccessView - 上传成功
 */

import React from "react";
import { CheckCircle2, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SuccessViewProps {
	onViewPlayback: () => void;
}

export function SuccessView({ onViewPlayback }: SuccessViewProps) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<Card className="p-4 border-green-500/20 bg-green-500/5">
				<div className="flex flex-col gap-3 items-center text-center">
					<CheckCircle2 className="w-12 h-12 text-green-500" />
					<div>
						<h3 className="font-semibold text-green-700 dark:text-green-400">
							上传成功
						</h3>
						<p className="text-sm text-muted-foreground mt-1">
							录像已成功保存到服务器
						</p>
					</div>
				</div>
			</Card>

			<Button onClick={onViewPlayback} className="w-full gap-2">
				查看回放
				<ArrowRight className="w-4 h-4" />
			</Button>

			<p className="text-xs text-center text-muted-foreground">
				点击按钮在新窗口中查看录像回放
			</p>
		</div>
	);
}
