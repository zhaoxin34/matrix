"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { createEvent, updateEvent } from "@/lib/api/events";
import type { Event, CreateEventInput, UpdateEventInput } from "./event-types";
import type { EmbeddedSite } from "@/components/embedded-site";

interface EventFormProps {
	workspaceCode: string;
	event?: Event;
	sites?: EmbeddedSite[];
	onSuccess?: () => void;
}

export function EventForm({
	workspaceCode,
	event,
	sites,
	onSuccess,
}: EventFormProps) {
	const router = useRouter();
	const isEditing = !!event;

	const [formData, setFormData] = useState<{
		name: string;
		entity_name: string;
		target_entity_name: string;
		actor: string;
		timestamp: string;
		page_url: string;
		session_id: string;
		metadata: string;
		embedded_site_id: string;
	}>({
		name: event?.name || "",
		entity_name: event?.entity_name || "",
		target_entity_name: event?.target_entity_name || "",
		actor: event?.actor || "",
		timestamp: event?.timestamp ? event.timestamp.slice(0, 16) : "",
		page_url: event?.page_url || "",
		session_id: event?.session_id || "",
		metadata: event?.metadata ? JSON.stringify(event.metadata, null, 2) : "",
		embedded_site_id: event?.embedded_site_id?.toString() || "__none__",
	});

	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = "事件名称不能为空";
		}

		if (!formData.entity_name.trim()) {
			newErrors.entity_name = "实体名称不能为空";
		} else if (!/^[a-z0-9_]+_[a-zA-Z0-9_]+$/.test(formData.entity_name)) {
			newErrors.entity_name = "实体名称格式错误，示例: lead_123";
		}

		if (!formData.actor.trim()) {
			newErrors.actor = "操作者不能为空";
		}

		if (!formData.timestamp) {
			newErrors.timestamp = "时间不能为空";
		}

		if (formData.page_url && !/^https?:\/\/.+/.test(formData.page_url)) {
			newErrors.page_url = "URL 格式错误";
		}

		if (formData.metadata) {
			try {
				JSON.parse(formData.metadata);
			} catch {
				newErrors.metadata = "JSON 格式错误";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setLoading(true);
		try {
			const data = {
				name: formData.name.trim(),
				entity_name: formData.entity_name.trim(),
				target_entity_name: formData.target_entity_name.trim() || undefined,
				actor: formData.actor.trim(),
				timestamp: new Date(formData.timestamp).toISOString(),
				page_url: formData.page_url.trim() || undefined,
				session_id: formData.session_id.trim() || undefined,
				metadata: formData.metadata ? JSON.parse(formData.metadata) : undefined,
				embedded_site_id:
					formData.embedded_site_id && formData.embedded_site_id !== "__none__"
						? Number(formData.embedded_site_id)
						: undefined,
			};

			if (isEditing && event) {
				const updateData: UpdateEventInput = {
					...data,
				};
				delete (updateData as unknown as { timestamp?: string }).timestamp;
				if (data.timestamp) {
					(updateData as unknown as { timestamp?: string }).timestamp =
						data.timestamp;
				}
				await updateEvent(workspaceCode, event.id, updateData);
				toast.success("事件更新成功");
			} else {
				await createEvent(workspaceCode, data as CreateEventInput);
				toast.success("事件创建成功");
			}

			onSuccess?.();
			router.push(`/workspace/${workspaceCode}/events`);
		} catch (error) {
			const err = error as { message?: string; code?: number };
			toast.error(err.message || "操作失败");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{isEditing ? "编辑事件" : "创建事件"}</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">
								事件名称 <span className="text-destructive">*</span>
							</Label>
							<Input
								id="name"
								placeholder="例如: lead.assigned"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								className={errors.name ? "border-destructive" : ""}
							/>
							{errors.name && (
								<p className="text-xs text-destructive">{errors.name}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="entity_name">
								实体名称 <span className="text-destructive">*</span>
							</Label>
							<Input
								id="entity_name"
								placeholder="例如: lead_123"
								value={formData.entity_name}
								onChange={(e) =>
									setFormData({ ...formData, entity_name: e.target.value })
								}
								className={errors.entity_name ? "border-destructive" : ""}
							/>
							{errors.entity_name && (
								<p className="text-xs text-destructive">{errors.entity_name}</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="actor">
								操作者 <span className="text-destructive">*</span>
							</Label>
							<Input
								id="actor"
								placeholder="例如: user_john"
								value={formData.actor}
								onChange={(e) =>
									setFormData({ ...formData, actor: e.target.value })
								}
								className={errors.actor ? "border-destructive" : ""}
							/>
							{errors.actor && (
								<p className="text-xs text-destructive">{errors.actor}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="timestamp">
								发生时间 <span className="text-destructive">*</span>
							</Label>
							<Input
								id="timestamp"
								type="datetime-local"
								value={formData.timestamp}
								onChange={(e) =>
									setFormData({ ...formData, timestamp: e.target.value })
								}
								className={errors.timestamp ? "border-destructive" : ""}
							/>
							{errors.timestamp && (
								<p className="text-xs text-destructive">{errors.timestamp}</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="target_entity_name">目标实体</Label>
							<Input
								id="target_entity_name"
								placeholder="例如: user_zhangsan"
								value={formData.target_entity_name}
								onChange={(e) =>
									setFormData({
										...formData,
										target_entity_name: e.target.value,
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="session_id">会话 ID</Label>
							<Input
								id="session_id"
								placeholder="例如: sess_abc123"
								value={formData.session_id}
								onChange={(e) =>
									setFormData({ ...formData, session_id: e.target.value })
								}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="page_url">页面 URL</Label>
						<Input
							id="page_url"
							placeholder="例如: https://crm.example.com/leads/123"
							value={formData.page_url}
							onChange={(e) =>
								setFormData({ ...formData, page_url: e.target.value })
							}
							className={errors.page_url ? "border-destructive" : ""}
						/>
						{errors.page_url && (
							<p className="text-xs text-destructive">{errors.page_url}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="metadata">元数据 (JSON)</Label>
						<Textarea
							id="metadata"
							placeholder='{"key": "value"}'
							value={formData.metadata}
							onChange={(e) =>
								setFormData({ ...formData, metadata: e.target.value })
							}
							className={`font-mono text-sm h-32 ${errors.metadata ? "border-destructive" : ""}`}
						/>
						{errors.metadata && (
							<p className="text-xs text-destructive">{errors.metadata}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="embedded_site_id">嵌入网站</Label>
						<Select
							value={formData.embedded_site_id}
							onValueChange={(v) =>
								setFormData({
									...formData,
									embedded_site_id: v,
								})
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="选择嵌入网站（可选）" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">无</SelectItem>
								{sites?.map((site) => (
									<SelectItem key={site.id} value={String(site.id)}>
										{site.site_name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex justify-end gap-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
							disabled={loading}
						>
							取消
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "提交中..." : isEditing ? "保存" : "创建"}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
