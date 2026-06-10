"use client";

import { useState } from "react";

import { AgentSteerPanel } from "@/components/agent-steer-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
	workspaceCode: string;
}

export default function AgentSteerDemoClient({ workspaceCode }: Props) {
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Form submitted:", formData);
		alert(
			"表单已提交！\n\n这是一个模拟的目标页面，Agent Steer 会录制你在上面的操作。",
		);
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto py-8 px-4">
				{/* 页面标题 */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold">Agent Steer 演示</h1>
					<p className="text-muted-foreground mt-2">
						右侧的 Agent Steer 面板会通过 rrweb 录制你在左侧表单上的所有操作，每
						10 分钟切分为一个 segment 上传。
					</p>
				</div>

				{/* 主内容区域：表单 + 录制面板 */}
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
					{/* 录制目标区域（rrweb snapshot 的稳定容器） */}
					<div data-rrweb-region="target">
						<div className="border rounded-lg p-8 bg-card text-card-foreground max-w-md">
							<h2 className="text-xl font-semibold mb-6">用户注册表单</h2>

							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="username">用户名</Label>
									<Input
										id="username"
										type="text"
										placeholder="请输入用户名"
										value={formData.username}
										onChange={(e) =>
											setFormData({ ...formData, username: e.target.value })
										}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">邮箱</Label>
									<Input
										id="email"
										type="email"
										placeholder="请输入邮箱"
										value={formData.email}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="password">密码</Label>
									<Input
										id="password"
										type="password"
										placeholder="请输入密码"
										value={formData.password}
										onChange={(e) =>
											setFormData({ ...formData, password: e.target.value })
										}
									/>
								</div>

								<div className="flex gap-2 pt-4">
									<Button type="submit" className="flex-1">
										提交
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() =>
											setFormData({ username: "", email: "", password: "" })
										}
									>
										重置
									</Button>
								</div>
							</form>

							<div className="mt-6 p-4 bg-muted/50 rounded-lg">
								<p className="text-xs text-muted-foreground">
									💡
									提示：在右侧面板点「开始录制」后，在本表单上的所有操作都会被
									rrweb 录制并上传到 S3。
								</p>
							</div>
						</div>
					</div>

					{/* Agent Steer 录制面板（sticky 在右侧） */}
					<div className="lg:sticky lg:top-6">
						<AgentSteerPanel workspaceCode={workspaceCode} />
					</div>
				</div>

				{/* 说明 */}
				<div className="mt-8 p-4 bg-muted/50 rounded-lg max-w-2xl">
					<h3 className="text-sm font-medium mb-3">架构说明</h3>
					<div className="text-xs text-muted-foreground space-y-2">
						<p>
							在生产场景中，Chrome Extension 的 Content Script 会把 Agent Steer
							面板以 iframe 形式注入到目标页面。这里为了简化（不做 chrome
							extension），直接把面板挂在前端 demo 页面右侧。
						</p>
						<p>
							录制链路：rrweb.record() → 每 10 分钟触发一次 consumeEvents() →
							拿后端 presigned URL → PUT 到 RustFS → POST /segments 注册。
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
