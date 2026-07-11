"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createStatus, updateStatus } from "@/lib/api/status";
import type {
	Status,
	CreateStatusInput,
	UpdateStatusInput,
} from "./status-types";

interface StatusFormProps {
	workspaceCode: string;
	status?: Status;
	onSuccess?: () => void;
}

export function StatusForm({
	workspaceCode,
	status,
	onSuccess,
}: StatusFormProps) {
	const router = useRouter();
	const isEditing = !!status;

	const [formData, setFormData] = useState<{
		entity_type: string;
		entity_id: string;
		stat_at: string;
		source: string;
		session_id: string;
		attributes: string;
	}>({
		entity_type: status?.entity_type || "",
		entity_id: status?.entity_id || "",
		stat_at: status?.stat_at ? status.stat_at.slice(0, 16) : "",
		source: status?.source || "",
		session_id: status?.session_id || "",
		attributes: status?.attributes
			? JSON.stringify(status.attributes, null, 2)
			: "{}",
	});

	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.entity_type.trim()) {
			newErrors.entity_type = "实体类型不能为空";
		} else if (!/^[a-z0-9_]+$/.test(formData.entity_type)) {
			newErrors.entity_type = "实体类型格式错误，只允许小写字母、数字和下划线";
		}

		if (!formData.entity_id.trim()) {
			newErrors.entity_id = "实体 ID 不能为空";
		}

		if (!formData.stat_at) {
			newErrors.stat_at = "统计时间不能为空";
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
				entity_type: formData.entity_type.trim(),
				entity_id: formData.entity_id.trim(),
				stat_at: new Date(formData.stat_at).toISOString(),
				attributes: JSON.parse(formData.attributes),
				source: formData.source.trim() || undefined,
				session_id: formData.session_id.trim() || undefined,
			};

			if (isEditing && status) {
				const updateData: UpdateStatusInput = {
					entity_type: data.entity_type,
					entity_id: data.entity_id,
					attributes: data.attributes,
					source: data.source,
					session_id: data.session_id,
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
							<Label htmlFor="entity_type">
								实体类型 <span className="text-destructive">*</span>
							</Label>
							<Input
								id="entity_type"
								placeholder="例如: lead, user"
								value={formData.entity_type}
								onChange={(e) =>
									setFormData({ ...formData, entity_type: e.target.value })
								}
								className={errors.entity_type ? "border-destructive" : ""}
							/>
							{errors.entity_type && (
								<p className="text-xs text-destructive">{errors.entity_type}</p>
							)}
							<p className="text-xs text-muted-foreground">
								小写字母、数字、下划线，如 lead、user
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="entity_id">
								实体 ID <span className="text-destructive">*</span>
							</Label>
							<Input
								id="entity_id"
								placeholder="例如: 123"
								value={formData.entity_id}
								onChange={(e) =>
									setFormData({ ...formData, entity_id: e.target.value })
								}
								className={errors.entity_id ? "border-destructive" : ""}
							/>
							{errors.entity_id && (
								<p className="text-xs text-destructive">{errors.entity_id}</p>
							)}
							<p className="text-xs text-muted-foreground">
								业务系统中的唯一标识
							</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="stat_at">
								统计时间 <span className="text-destructive">*</span>
							</Label>
							<Input
								id="stat_at"
								type="datetime-local"
								value={formData.stat_at}
								onChange={(e) =>
									setFormData({ ...formData, stat_at: e.target.value })
								}
								className={errors.stat_at ? "border-destructive" : ""}
							/>
							{errors.stat_at && (
								<p className="text-xs text-destructive">{errors.stat_at}</p>
							)}
						</div>

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
					</div>

					<div className="grid grid-cols-2 gap-4">
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
