"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createInterceptor, updateInterceptor } from "@/lib/api/interceptors";
import type { Interceptor } from "@/components/interceptor/interceptor-types";

interface InterceptorFormProps {
	workspaceCode: string;
	interceptor?: Interceptor;
	sites: Array<{ id: number; name: string }>;
	mode: "create" | "edit";
}

export function InterceptorForm({
	workspaceCode,
	interceptor,
	sites,
	mode,
}: InterceptorFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const triggerRecord = (interceptor?.trigger ?? {}) as Record<string, string>;
	const [formData, setFormData] = useState({
		embedded_site_id: interceptor?.embedded_site_id ?? 0,
		name: interceptor?.name ?? "",
		event_name: interceptor?.event_name ?? "",
		entity_name: interceptor?.entity_name ?? "",
		target_entity_name: interceptor?.target_entity_name ?? "",
		mode: interceptor?.mode ?? "observe",
		trigger_type: interceptor?.trigger_type ?? "dom",
		selector: triggerRecord.selector ?? "",
		url_pattern: triggerRecord.url_pattern ?? "",
		method: triggerRecord.method ?? "POST",
		page_url_pattern: interceptor?.page_url_pattern ?? "",
		debounce_ms: interceptor?.debounce_ms ?? 1000,
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (!formData.embedded_site_id) {
				toast.error("请选择站点");
				return;
			}
			if (!formData.name.trim()) {
				toast.error("请输入名称");
				return;
			}
			if (!formData.event_name.trim()) {
				toast.error("请输入事件名");
				return;
			}
			if (!formData.entity_name.trim()) {
				toast.error("请输入实体名");
				return;
			}

			const trigger = {
				type: formData.trigger_type,
				...(formData.trigger_type === "dom"
					? { selector: formData.selector }
					: { url_pattern: formData.url_pattern, method: formData.method }),
			};

			const data = {
				embedded_site_id: formData.embedded_site_id,
				name: formData.name,
				event_name: formData.event_name,
				entity_name: formData.entity_name,
				target_entity_name: formData.target_entity_name || undefined,
				mode: formData.mode,
				trigger,
				page_url_pattern: formData.page_url_pattern || undefined,
				debounce_ms: formData.debounce_ms,
			};

			if (mode === "create") {
				await createInterceptor(workspaceCode, data);
				toast.success("创建成功");
			} else {
				await updateInterceptor(workspaceCode, interceptor!.id, data);
				toast.success("更新成功");
			}
			router.push(`/workspace/${workspaceCode}/interceptors`);
		} catch {
			toast.error(mode === "create" ? "创建失败" : "更新失败");
		} finally {
			setLoading(false);
		}
	};

	const updateField = (field: string, value: string | number) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{mode === "create" ? "创建拦截器" : "编辑拦截器"}</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Site Selection */}
					<div className="space-y-2">
						<Label htmlFor="embedded_site_id">站点</Label>
						<Select
							value={
								formData.embedded_site_id
									? String(formData.embedded_site_id)
									: "__none__"
							}
							onValueChange={(v) => updateField("embedded_site_id", Number(v))}
						>
							<SelectTrigger>
								<SelectValue placeholder="选择站点" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">请选择站点</SelectItem>
								{sites.map((site) => (
									<SelectItem key={site.id} value={String(site.id)}>
										{site.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Name */}
					<div className="space-y-2">
						<Label htmlFor="name">名称</Label>
						<Input
							id="name"
							placeholder="例如：分配线索确认"
							value={formData.name}
							onChange={(e) => updateField("name", e.target.value)}
						/>
					</div>

					{/* Event Name */}
					<div className="space-y-2">
						<Label htmlFor="event_name">事件名</Label>
						<Input
							id="event_name"
							placeholder="例如：lead.assigned"
							value={formData.event_name}
							onChange={(e) => updateField("event_name", e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							触发后上报的 Event 名称
						</p>
					</div>

					{/* Entity Name */}
					<div className="space-y-2">
						<Label htmlFor="entity_name">实体名</Label>
						<Input
							id="entity_name"
							placeholder="例如：lead"
							value={formData.entity_name}
							onChange={(e) => updateField("entity_name", e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							被拦截/操作的实体名（主语）
						</p>
					</div>

					{/* Target Entity Name */}
					<div className="space-y-2">
						<Label htmlFor="target_entity_name">目标实体名（选填）</Label>
						<Input
							id="target_entity_name"
							placeholder="例如：user"
							value={formData.target_entity_name}
							onChange={(e) =>
								updateField("target_entity_name", e.target.value)
							}
						/>
						<p className="text-xs text-muted-foreground">
							操作的目标实体名（宾语）
						</p>
					</div>

					{/* Mode */}
					<div className="space-y-2">
						<Label htmlFor="mode">模式</Label>
						<Select
							value={formData.mode}
							onValueChange={(v) => updateField("mode", v)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="observe">观察模式 (Observe)</SelectItem>
								<SelectItem value="intercept">拦截模式 (Intercept)</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							观察模式仅记录，拦截模式会阻止操作
						</p>
					</div>

					{/* Trigger Type */}
					<div className="space-y-2">
						<Label htmlFor="trigger_type">触发类型</Label>
						<Select
							value={formData.trigger_type}
							onValueChange={(v) => updateField("trigger_type", v)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="dom">DOM 点击 (DOM Click)</SelectItem>
								<SelectItem value="network">网络请求 (Network)</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Trigger Config */}
					{formData.trigger_type === "dom" ? (
						<div className="space-y-2">
							<Label htmlFor="selector">CSS 选择器</Label>
							<Input
								id="selector"
								placeholder="例如：#assign-btn, .btn-submit"
								value={formData.selector}
								onChange={(e) => updateField("selector", e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">
								用于匹配目标元素的 CSS 选择器
							</p>
						</div>
					) : (
						<>
							<div className="space-y-2">
								<Label htmlFor="url_pattern">URL Pattern</Label>
								<Input
									id="url_pattern"
									placeholder="例如：/api/leads/*/assign"
									value={formData.url_pattern}
									onChange={(e) => updateField("url_pattern", e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									匹配目标请求的 URL 正则
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="method">HTTP 方法</Label>
								<Select
									value={formData.method}
									onValueChange={(v) => updateField("method", v)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="GET">GET</SelectItem>
										<SelectItem value="POST">POST</SelectItem>
										<SelectItem value="PUT">PUT</SelectItem>
										<SelectItem value="DELETE">DELETE</SelectItem>
										<SelectItem value="PATCH">PATCH</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</>
					)}

					{/* Page URL Pattern */}
					<div className="space-y-2">
						<Label htmlFor="page_url_pattern">页面 URL Pattern（选填）</Label>
						<Input
							id="page_url_pattern"
							placeholder="例如：https://crm.example.com/leads/*"
							value={formData.page_url_pattern}
							onChange={(e) => updateField("page_url_pattern", e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							限定拦截器生效的页面 URL
						</p>
					</div>

					{/* Debounce */}
					<div className="space-y-2">
						<Label htmlFor="debounce_ms">防重入时间 (ms)</Label>
						<Input
							id="debounce_ms"
							type="number"
							value={formData.debounce_ms}
							onChange={(e) =>
								updateField("debounce_ms", Number(e.target.value))
							}
						/>
						<p className="text-xs text-muted-foreground">
							防止重复触发的间隔时间
						</p>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-4">
						<Button type="submit" disabled={loading}>
							{loading ? "提交中..." : mode === "create" ? "创建" : "保存"}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() =>
								router.push(`/workspace/${workspaceCode}/interceptors`)
							}
						>
							取消
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
