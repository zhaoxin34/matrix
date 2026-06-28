"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { Interceptor } from "@/components/interceptor/interceptor-types";

interface InterceptorDetailProps {
	interceptor: Interceptor;
	workspaceCode: string;
	siteName: string;
}

function formatDate(dateStr: string) {
	return new Date(dateStr).toLocaleString("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function InterceptorDetail({
	interceptor,
	workspaceCode,
	siteName,
}: InterceptorDetailProps) {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<h2 className="text-xl font-semibold">{interceptor.name}</h2>
					<Badge
						variant={interceptor.status === "ENABLED" ? "default" : "secondary"}
					>
						{interceptor.status === "ENABLED" ? "已启用" : "已禁用"}
					</Badge>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" asChild>
						<a
							href={`/workspace/${workspaceCode}/interceptors/${interceptor.id}/edit`}
						>
							编辑
						</a>
					</Button>
					<Button variant="outline" asChild>
						<a href={`/workspace/${workspaceCode}/interceptors`}>返回列表</a>
					</Button>
				</div>
			</div>

			<div className="grid gap-6">
				{/* Basic Info */}
				<Card>
					<CardHeader>
						<CardTitle>基本信息</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="text-muted-foreground">站点</Label>
								<p className="mt-1">{siteName}</p>
							</div>
							<div>
								<Label className="text-muted-foreground">事件名</Label>
								<p className="mt-1 font-mono">{interceptor.event_name}</p>
							</div>
							<div>
								<Label className="text-muted-foreground">实体名</Label>
								<p className="mt-1">{interceptor.entity_name}</p>
							</div>
							<div>
								<Label className="text-muted-foreground">目标实体</Label>
								<p className="mt-1">{interceptor.target_entity_name || "-"}</p>
							</div>
							<div>
								<Label className="text-muted-foreground">模式</Label>
								<p className="mt-1">
									{interceptor.mode === "observe" ? "观察模式" : "拦截模式"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground">防重入时间</Label>
								<p className="mt-1">{interceptor.debounce_ms}ms</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Trigger Config */}
				<Card>
					<CardHeader>
						<CardTitle>触发配置</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="text-muted-foreground">触发类型</Label>
								<p className="mt-1">
									<Badge variant="outline">
										{interceptor.trigger_type === "dom" ? "DOM" : "Network"}
									</Badge>
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground">
									页面 URL Pattern
								</Label>
								<p className="mt-1 font-mono text-sm">
									{interceptor.page_url_pattern || "-"}
								</p>
							</div>
						</div>
						<div>
							<Label className="text-muted-foreground">Trigger 配置</Label>
							<pre className="mt-2 rounded bg-muted p-4 text-sm">
								{JSON.stringify(interceptor.trigger, null, 2)}
							</pre>
						</div>
					</CardContent>
				</Card>

				{/* Actions */}
				{(interceptor.before_actions?.length > 0 ||
					interceptor.after_actions?.length > 0) && (
					<Card>
						<CardHeader>
							<CardTitle>Actions</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							{interceptor.before_actions?.length > 0 && (
								<div>
									<Label className="text-muted-foreground">
										Before Actions
									</Label>
									<pre className="mt-2 rounded bg-muted p-4 text-sm">
										{JSON.stringify(interceptor.before_actions, null, 2)}
									</pre>
								</div>
							)}
							{interceptor.after_actions?.length > 0 && (
								<div>
									<Label className="text-muted-foreground">After Actions</Label>
									<pre className="mt-2 rounded bg-muted p-4 text-sm">
										{JSON.stringify(interceptor.after_actions, null, 2)}
									</pre>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Meta */}
				<Card>
					<CardHeader>
						<CardTitle>元信息</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="text-muted-foreground">创建时间</Label>
								<p className="mt-1">{formatDate(interceptor.created_at)}</p>
							</div>
							<div>
								<Label className="text-muted-foreground">更新时间</Label>
								<p className="mt-1">{formatDate(interceptor.updated_at)}</p>
							</div>
							<div>
								<Label className="text-muted-foreground">ID</Label>
								<p className="mt-1 font-mono">{interceptor.id}</p>
							</div>
							<div>
								<Label className="text-muted-foreground">创建者</Label>
								<p className="mt-1">User #{interceptor.created_by}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
