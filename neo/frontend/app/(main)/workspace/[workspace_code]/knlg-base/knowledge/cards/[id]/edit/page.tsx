"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	getKnowledgeCard,
	updateKnowledgeCard,
} from "@/lib/api/knlg-base/knowledge";
import type { KnowledgeCard } from "@/lib/api/knlg-base/_base";

export default function EditKnowledgeCardPage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;
	const id = parseInt(params.id as string);

	const [card, setCard] = useState<KnowledgeCard | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		(async () => {
			try {
				const c = await getKnowledgeCard(workspaceCode, id);
				setCard(c);
			} catch (e) {
				console.error(e);
			}
		})();
	}, [workspaceCode, id]);

	if (!card) return <p>加载中...</p>;

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitting(true);
		setError("");
		const form = new FormData(e.currentTarget);
		try {
			await updateKnowledgeCard(workspaceCode, id, {
				title: form.get("title") as string,
				statement: form.get("statement") as string,
				domain: form.get("domain") as string,
				type: form.get("type") as string,
				tags: (form.get("tags") as string)
					.split(",")
					.map((t) => t.trim())
					.filter(Boolean),
				conditions: (form.get("conditions") as string) || undefined,
				exceptions: (form.get("exceptions") as string) || undefined,
				confidence: parseFloat(form.get("confidence") as string),
			});
			router.push(
				`/workspace/${workspaceCode}/knlg-base/knowledge/cards/${id}` as `/${string}`,
			);
		} catch (err: unknown) {
			const e = err as { message?: string };
			setError(e.message || "更新失败");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="max-w-3xl">
			<h1 className="text-3xl font-bold mb-6">编辑知识卡片</h1>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<Label htmlFor="title">标题</Label>
					<Input id="title" name="title" defaultValue={card.title} required />
				</div>
				<div>
					<Label htmlFor="statement">核心陈述</Label>
					<Textarea
						id="statement"
						name="statement"
						defaultValue={card.statement}
						required
						rows={4}
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label htmlFor="domain">领域</Label>
						<Input
							id="domain"
							name="domain"
							defaultValue={card.domain}
							required
						/>
					</div>
					<div>
						<Label htmlFor="type">类型</Label>
						<Input id="type" name="type" defaultValue={card.type} required />
					</div>
				</div>
				<div>
					<Label htmlFor="tags">标签（逗号分隔）</Label>
					<Input
						id="tags"
						name="tags"
						defaultValue={card.tags?.join(", ") || ""}
					/>
				</div>
				<div>
					<Label htmlFor="conditions">适用条件</Label>
					<Textarea
						id="conditions"
						name="conditions"
						defaultValue={card.conditions || ""}
						rows={2}
					/>
				</div>
				<div>
					<Label htmlFor="exceptions">例外</Label>
					<Textarea
						id="exceptions"
						name="exceptions"
						defaultValue={card.exceptions || ""}
						rows={2}
					/>
				</div>
				<div>
					<Label htmlFor="confidence">置信度</Label>
					<Input
						id="confidence"
						name="confidence"
						type="number"
						min="0"
						max="1"
						step="0.05"
						defaultValue={card.confidence}
					/>
				</div>
				{error && <p className="text-red-600">{error}</p>}
				<div className="flex gap-2">
					<Button type="submit" disabled={submitting}>
						{submitting ? "更新中..." : "更新"}
					</Button>
					<Button type="button" variant="outline" onClick={() => router.back()}>
						取消
					</Button>
				</div>
			</form>
		</div>
	);
}
