"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createKnowledgeCard } from "@/lib/api/knlg-base/knowledge";

export default function NewKnowledgeCardPage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;

	const [title, setTitle] = useState("");
	const [statement, setStatement] = useState("");
	const [domain, setDomain] = useState("opportunity");
	const [type, setType] = useState("judgement");
	const [tags, setTags] = useState("");
	const [conditions, setConditions] = useState("");
	const [exceptions, setExceptions] = useState("");
	const [confidence, setConfidence] = useState(0.5);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		setError("");
		try {
			await createKnowledgeCard(workspaceCode, {
				title,
				statement,
				domain,
				type,
				tags: tags
					? tags
							.split(",")
							.map((t) => t.trim())
							.filter(Boolean)
					: [],
				conditions: conditions || undefined,
				exceptions: exceptions || undefined,
				confidence,
			});
			router.push(
				`/workspace/${workspaceCode}/knlg-base/knowledge` as `/${string}`,
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
			<h1 className="text-3xl font-bold mb-6">新建知识卡片</h1>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<Label htmlFor="title">标题 *</Label>
					<Input
						id="title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						required
						maxLength={255}
					/>
				</div>
				<div>
					<Label htmlFor="statement">核心陈述 *</Label>
					<Textarea
						id="statement"
						value={statement}
						onChange={(e) => setStatement(e.target.value)}
						required
						rows={4}
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label>领域 *</Label>
						<Input
							value={domain}
							onChange={(e) => setDomain(e.target.value)}
							required
						/>
					</div>
					<div>
						<Label>类型 *</Label>
						<Select value={type} onValueChange={setType}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="judgement">judgement (判断)</SelectItem>
								<SelectItem value="risk">risk (风险)</SelectItem>
								<SelectItem value="opportunity">opportunity (机会)</SelectItem>
								<SelectItem value="process">process (流程)</SelectItem>
								<SelectItem value="communication">
									communication (沟通)
								</SelectItem>
								<SelectItem value="competitive">competitive (竞争)</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div>
					<Label htmlFor="tags">标签（逗号分隔）</Label>
					<Input
						id="tags"
						value={tags}
						onChange={(e) => setTags(e.target.value)}
						placeholder="制造业, 大客户"
					/>
				</div>
				<div>
					<Label htmlFor="conditions">适用条件</Label>
					<Textarea
						id="conditions"
						value={conditions}
						onChange={(e) => setConditions(e.target.value)}
						rows={2}
					/>
				</div>
				<div>
					<Label htmlFor="exceptions">例外与边界</Label>
					<Textarea
						id="exceptions"
						value={exceptions}
						onChange={(e) => setExceptions(e.target.value)}
						rows={2}
					/>
				</div>
				<div>
					<Label htmlFor="confidence">置信度 (0-1): {confidence}</Label>
					<Input
						id="confidence"
						type="range"
						min="0"
						max="1"
						step="0.05"
						value={confidence}
						onChange={(e) => setConfidence(parseFloat(e.target.value))}
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
