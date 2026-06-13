/**
 * IdleView - 空闲状态（准备录制）
 */

import React from "react";
import { CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface IdleViewProps {
	onStartRecording: () => void;
}

export function IdleView({ onStartRecording }: IdleViewProps) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<Card className="p-4 border-border/50">
				<div className="flex flex-col gap-2 items-center text-center">
					<div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
						<CircleDot className="w-6 h-6 text-muted-foreground" />
					</div>
					<div>
						<h3 className="font-medium text-sm">准备就绪</h3>
						<p className="text-xs text-muted-foreground mt-1">
							点击开始录制您的操作
						</p>
					</div>
				</div>
			</Card>

			<Button
				onClick={onStartRecording}
				variant="default"
				size="lg"
				className="w-full gap-2 bg-red-500 hover:bg-red-600 text-white"
			>
				<CircleDot className="w-5 h-5 fill-current" />
				开始录制
			</Button>

			<p className="text-xs text-center text-muted-foreground">
				录制将捕获您的所有页面操作
			</p>
		</div>
	);
}
