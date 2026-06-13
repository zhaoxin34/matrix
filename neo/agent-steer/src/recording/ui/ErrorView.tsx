/**
 * ErrorView - 上传失败
 */

import React from "react";
import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

interface ErrorViewProps {
	error: string;
	onRetry: () => void;
	onCancel: () => void;
}

export function ErrorView({ error, onRetry, onCancel }: ErrorViewProps) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<Alert variant="destructive" className="gap-2">
				<AlertTriangle className="w-4 h-4" />
				<div className="flex flex-col gap-1">
					<p className="font-medium text-sm">上传失败</p>
					<p className="text-xs opacity-80">{error}</p>
				</div>
			</Alert>

			<Card className="p-3 bg-muted/50">
				<p className="text-xs text-muted-foreground text-center">
					请检查网络连接后重试
				</p>
			</Card>

			<div className="flex gap-2">
				<Button variant="outline" onClick={onCancel} className="flex-1 gap-2">
					<X className="w-4 h-4" />
					取消
				</Button>
				<Button onClick={onRetry} className="flex-1 gap-2">
					<RotateCcw className="w-4 h-4" />
					重试
				</Button>
			</div>
		</div>
	);
}
