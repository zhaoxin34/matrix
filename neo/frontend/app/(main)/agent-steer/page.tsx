"use client";

import { AgentSteer } from "./components";

export default function AgentSteerPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* 模拟目标页面容器 */}
			<div className="container mx-auto py-8">
				<div className="mb-6">
					<h1 className="text-2xl font-bold">Agent Steer UI 原型</h1>
					<p className="text-sm text-muted-foreground mt-1">
						用于验证 Agent Steer 界面布局和交互逻辑
					</p>
				</div>

				{/* 模拟目标页面 */}
				<div className="relative">
					{/* 模拟网页内容 */}
					<div className="border rounded-lg p-8 bg-card text-card-foreground">
						<div className="space-y-4">
							<div className="h-8 bg-muted rounded w-1/2" />
							<div className="h-4 bg-muted rounded w-3/4" />
							<div className="h-4 bg-muted rounded w-2/3" />
							<div className="h-32 bg-muted rounded" />
							<div className="flex gap-2">
								<div className="h-10 bg-muted rounded w-24" />
								<div className="h-10 bg-muted rounded w-24" />
							</div>
						</div>

						{/* Agent Steer iframe 容器 */}
						<div className="absolute bottom-4 right-4">
							<AgentSteer />
						</div>
					</div>

					{/* 说明 */}
					<div className="mt-4 p-4 bg-muted/50 rounded-lg">
						<h3 className="text-sm font-medium mb-2">使用说明</h3>
						<ul className="text-xs text-muted-foreground space-y-1">
							<li>• 选择不同的模式（学习/指导/主动）查看对应界面</li>
							<li>• 学习模式下可以测试录制控制（开始/暂停/恢复/停止）</li>
							<li>• 指导模式下可以测试回放控制（播放/暂停/停止/跳转）</li>
							<li>• 点击右上角 🐛 按钮可以显示/隐藏调试信息</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
