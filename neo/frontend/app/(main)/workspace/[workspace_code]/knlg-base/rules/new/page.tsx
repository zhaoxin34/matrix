"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRule } from "@/lib/api/knlg-base/rule";

export default function NewRulePage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;

	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitting(true);
		setError("");
		const form = new FormData(e.currentTarget);
		try {
			const rule = await createRule(workspaceCode, {
				name: form.get("name") as string,
				description: (form.get("description") as string) || undefined,
				source_kc_id: parseInt(form.get("source_kc_id") as string),
				scope: {},
				trigger: {
					type: "event_subscription",
					event_name: form.get("event_name") as string,
				},
				conditions: [],
				conclusion: { message: form.get("conclusion") as string },
				confidence: parseFloat((form.get("confidence") as string) || "0.5"),
			});
			router.push(
				`/workspace/${workspaceCode}/knlg-base/rules/${rule.id}` as `/${string}`,
			);
		} catch (err: unknown) {
			const e = err as { message?: string };
			setError(e.message || "创建失败");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="max-w-3xl">
			<h1 className="text-3xl font-bold mb-6">新建规则</h1>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<Label htmlFor="name">名称 *</Label>
					<Input id="name" name="name" required maxLength={255} />
				</div>
				<div>
					<Label htmlFor="description">说明</Label>
					<Textarea id="description" name="description" rows={2} />
				</div>
				<div>
					<Label htmlFor="source_kc_id">来源知识卡片 ID *</Label>
					<Input id="source_kc_id" name="source_kc_id" type="number" required />
				</div>
				<div>
					<Label htmlFor="event_name">订阅事件名 *</Label>
					<Input
						id="event_name"
						name="event_name"
						placeholder="opportunity.stage_changed"
						required
					/>
				</div>
				<div>
					<Label htmlFor="conclusion">结论消息</Label>
					<Input
						id="conclusion"
						name="conclusion"
						placeholder="客户需要尽快跟进"
					/>
				</div>
				<div>
					<Label htmlFor="confidence">置信度 (0-1)</Label>
					<Input
						id="confidence"
						name="confidence"
						type="number"
						min="0"
						max="1"
						step="0.05"
						defaultValue="0.5"
					/>
				</div>
				{error && <p className="text-red-600">{error}</p>}
				<div className="flex gap-2">
					<Button type="submit" disabled={submitting}>
						{submitting ? "创建中..." : "创建"}
					</Button>
					<Button type="button" variant="outline" onClick={() => router.back()}>
						取消
					</Button>
				</div>
			</form>
		</div>
	);
}
