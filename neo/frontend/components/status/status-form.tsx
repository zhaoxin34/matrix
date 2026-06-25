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
import { createStatus, updateStatus } from "@/lib/api/status";
import type {
	Status,
	CreateStatusInput,
	UpdateStatusInput,
} from "./status-types";
import type { EmbeddedSite } from "@/components/embedded-site";

interface StatusFormProps {
	workspaceCode: string;
	status?: Status;
	sites?: EmbeddedSite[];
	onSuccess?: () => void;
}

export function StatusForm({
	workspaceCode,
	status,
	sites,
	onSuccess,
}: StatusFormProps) {
	const router = useRouter();
	const isEditing = !!status;

	const [formData, setFormData] = useState<{
		entity_name: string;
		captured_at: string;
		source: string;
		session_id: string;
		attributes: string;
		embedded_site_id: string;
	}>({
		entity_name: status?.entity_name || "",
		captured_at: status?.captured_at ? status.captured_at.slice(0, 16) : "",
		source: status?.source || "",
		session_id: status?.session_id || "",
		attributes: status?.attributes
			? JSON.stringify(status.attributes, null, 2)
			: "{}",
		embedded_site_id: status?.embedded_site_id?.toString() || "__none__",
	});

	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.entity_name.trim()) {
			newErrors.entity_name = "实体名称不能为空";
		} else if (!/^[a-z0-9_]+_[a-zA-Z0-9_]+$/.test(formData.entity_name)) {
			newErrors.entity_name = "实体名称格式错误，示例: lead_123";
		}

		if (!formData.captured_at) {
			newErrors.captured_at = "采集时间不能为空";
		}

		if (!formData.attributes.trim()) {
			newErrors.attributes = "属性不能为空";
		} else {
			try {
				JSON.parse(formData.attributes);
			} catch {
				newErrors.attributes = "JSON 格式错误";
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
			const data: CreateStatusInput = {
				entity_name: formData.entity_name.trim(),
				captured_at: new Date(formData.captured_at).toISOString(),
				attributes: JSON.parse(formData.attributes),
				source: formData.source.trim() || undefined,
				session_id: formData.session_id.trim() || undefined,
				embedded_site_id:
					formData.embedded_site_id && formData.embedded_site_id !== "__none__"
						? Number(formData.embedded_site_id)
						: undefined,
			};

			if (isEditing && status) {
				const updateData: UpdateStatusInput = {
					entity_name: data.entity_name,
					attributes: data.attributes,
					source: data.source,
					session_id: data.session_id,
					embedded_site_id: data.embedded_site_id,
				};
				await updateStatus(workspaceCode, status.id, updateData);
				toast.success("状态记录更新成功");
			} else {
				await createStatus(workspaceCode, data);
				toast.success("状态记录创建成功");
			}

			onSuccess?.();
			router.push(`/workspace/${workspaceCode}/status`);
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
				<CardTitle>{isEditing ? "编辑状态" : "创建状态"}</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-2 gap-4">
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

						<div className="space-y-2">
							<Label htmlFor="captured_at">
								采集时间 <span className="text-destructive">*</span>
							</Label>
							<Input
								id="captured_at"
								type="datetime-local"
								value={formData.captured_at}
								onChange={(e) =>
									setFormData({ ...formData, captured_at: e.target.value })
								}
								className={errors.captured_at ? "border-destructive" : ""}
							/>
							{errors.captured_at && (
								<p className="text-xs text-destructive">{errors.captured_at}</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="source">来源</Label>
							<Input
								id="source"
								placeholder="例如: crm_page_view"
								value={formData.source}
								onChange={(e) =>
									setFormData({ ...formData, source: e.target.value })
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
						<Label htmlFor="attributes">
							属性 (JSON) <span className="text-destructive">*</span>
						</Label>
						<Textarea
							id="attributes"
							placeholder='{"name": "张三", "phone": "13800138000"}'
							value={formData.attributes}
							onChange={(e) =>
								setFormData({ ...formData, attributes: e.target.value })
							}
							className={`font-mono text-sm h-40 ${errors.attributes ? "border-destructive" : ""}`}
						/>
						{errors.attributes && (
							<p className="text-xs text-destructive">{errors.attributes}</p>
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
