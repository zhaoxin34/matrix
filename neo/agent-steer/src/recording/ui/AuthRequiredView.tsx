/**
 * AuthRequiredView - 未登录/未选工作区/连接超时提示
 */

import { AlertTriangle, Settings, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AuthRequiredViewProps {
	onOpenNeo: () => void;
	onRetry: () => void;
	onOpenSettings: () => void;
	errorType?: "notLoggedIn" | "noWorkspace" | "timeout";
}

export function AuthRequiredView({
	onOpenNeo,
	onRetry,
	onOpenSettings,
	errorType = "notLoggedIn",
}: AuthRequiredViewProps) {
	const getTitle = () => {
		switch (errorType) {
			case "notLoggedIn":
				return "请先登录 Neo";
			case "noWorkspace":
				return "请选择工作区";
			case "timeout":
				return "连接超时";
			default:
				return "请先登录 Neo";
		}
	};

	const getDescription = () => {
		switch (errorType) {
			case "notLoggedIn":
				return "打开 Neo 并登录后返回此处";
			case "noWorkspace":
				return "请在 Neo 中选择一个工作区";
			case "timeout":
				return "无法连接到 Neo，请检查网络设置";
			default:
				return "打开 Neo 并登录后返回此处";
		}
	};

	return (
		<div className="flex flex-col gap-4 p-4 animate-fade-in">
			<Card className="p-4 border-[#f59e0b]/20 bg-[#f59e0b]/5">
				<div className="flex items-start gap-3">
					<div className="w-10 h-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center shrink-0">
						<AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
					</div>
					<div className="flex flex-col gap-1 min-w-0 flex-1">
						<h3 className="font-semibold text-sm text-[#e7e9ea]">
							{getTitle()}
						</h3>
						<p className="text-xs text-[#8b98a5] leading-relaxed">
							{getDescription()}
						</p>
					</div>
				</div>
			</Card>

			<div className="flex flex-col gap-2">
				<Button onClick={onOpenNeo} className="w-full gap-2" size="lg">
					<ExternalLink className="w-4 h-4" />
					打开 Neo
				</Button>

				<div className="flex gap-2">
					{errorType === "timeout" && (
						<Button
							variant="secondary"
							onClick={onRetry}
							className="flex-1 gap-2"
						>
							<RefreshCw className="w-4 h-4" />
							重试
						</Button>
					)}

					<Button
						variant="outline"
						onClick={onOpenSettings}
						className={
							errorType === "timeout" ? "flex-1 gap-2" : "w-full gap-2"
						}
					>
						<Settings className="w-4 h-4" />
						{errorType === "timeout" ? "设置" : "配置地址"}
					</Button>
				</div>
			</div>
		</div>
	);
}
