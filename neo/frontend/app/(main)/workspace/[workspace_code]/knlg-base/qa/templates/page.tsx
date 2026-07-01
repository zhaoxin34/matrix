"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/knlg-base/StatusBadge";
import {
	listQuestionTrees,
	createQuestionTree,
	cloneQuestionTree,
	deleteQuestionTree,
} from "@/lib/api/knlg-base/qa";
import type { QuestionTree } from "@/lib/api/knlg-base/_base";

const DEFAULT_QUESTIONS = JSON.stringify(
	[
		{
			id: "Q1",
			text: "示例问题：您的领域核心判断是什么？",
			followups: ["为什么？", "能举例吗？"],
		},
	],
	null,
	2,
);

export default function QuestionTemplatesPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const [trees, setTrees] = useState<QuestionTree[]>([]);
	const [editing, setEditing] = useState<QuestionTree | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [name, setName] = useState("");
	const [domain, setDomain] = useState("opportunity");
	const [description, setDescription] = useState("");
	const [questionsJson, setQuestionsJson] = useState(DEFAULT_QUESTIONS);
	const [jsonError, setJsonError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const fetchData = async () => {
		try {
			const data = await listQuestionTrees(workspaceCode);
			setTrees(data.items);
		} catch (e) {
			console.error(e);
		}
	};

	useEffect(() => {
		fetchData();
	}, [workspaceCode]);

	const openCreate = () => {
		setEditing(null);
		setName("");
		setDomain("opportunity");
		setDescription("");
		setQuestionsJson(DEFAULT_QUESTIONS);
		setJsonError("");
		setIsOpen(true);
	};

	const openEdit = (tree: QuestionTree) => {
		setEditing(tree);
		setName(tree.name);
		setDomain(tree.domain);
		setDescription(tree.description || "");
		setQuestionsJson(JSON.stringify(tree.questions, null, 2));
		setJsonError("");
		setIsOpen(true);
	};

	const validateAndParse = (): Array<{
		id: string;
		text: string;
		followups?: string[];
	}> | null => {
		try {
			const parsed = JSON.parse(questionsJson);
			if (!Array.isArray(parsed)) {
				setJsonError("Questions must be an array");
				return null;
			}
			for (const q of parsed) {
				if (!q.id || !q.text) {
					setJsonError("Each question must have 'id' and 'text' fields");
					return null;
				}
			}
			return parsed;
		} catch (e) {
			setJsonError(`Invalid JSON: ${(e as Error).message}`);
			return null;
		}
	};

	const handleSubmit = async () => {
		const questions = validateAndParse();
		if (!questions) return;
		setSubmitting(true);
		try {
			if (editing) {
				// Update creates a new version (deactivates old)
				const { updateQuestionTree } = await import("@/lib/api/knlg-base/qa");
				await updateQuestionTree(workspaceCode, editing.id, {
					name,
					domain,
					description,
					questions,
				});
			} else {
				await createQuestionTree(workspaceCode, {
					name,
					domain,
					description,
					questions,
				});
			}
			setIsOpen(false);
			fetchData();
		} catch (err) {
			const e = err as { message?: string };
			setJsonError(e.message || "Save failed");
		} finally {
			setSubmitting(false);
		}
	};

	const handleClone = async (id: number) => {
		await cloneQuestionTree(workspaceCode, id);
		fetchData();
	};

	const handleDelete = async (id: number) => {
		if (!confirm("确认删除？")) return;
		await deleteQuestionTree(workspaceCode, id);
		fetchData();
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold">问题树模板</h1>
				<Button onClick={openCreate}>新建模板</Button>
			</div>
			<div className="space-y-2">
				{trees.map((tree) => (
					<Card key={tree.id}>
						<CardHeader>
							<div className="flex justify-between items-center">
								<div>
									<h2 className="font-semibold">{tree.name}</h2>
									<p className="text-sm text-muted-foreground">
										领域：{tree.domain} · {tree.questions.length} 个问题
									</p>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
										v{tree.version}
									</span>
									<StatusBadge
										status={tree.is_active ? "active" : "deprecated"}
									/>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm mb-3">{tree.description}</p>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => openEdit(tree)}
								>
									编辑（新建版本）
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleClone(tree.id)}
								>
									克隆
								</Button>
								<Button
									size="sm"
									variant="destructive"
									onClick={() => handleDelete(tree.id)}
								>
									删除
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
				{trees.length === 0 && (
					<p className="text-muted-foreground text-center py-8">
						暂无模板。点击&ldquo;新建模板&rdquo;开始。
					</p>
				)}
			</div>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editing
								? `编辑模板（v${editing.version} → 新版本）`
								: "新建问题树模板"}
						</DialogTitle>
						<DialogDescription>
							编辑问题树 JSON 格式。每个问题必须有 id 和 text 字段。
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="t-name">名称 *</Label>
							<Input
								id="t-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								maxLength={255}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="t-domain">领域 *</Label>
								<Input
									id="t-domain"
									value={domain}
									onChange={(e) => setDomain(e.target.value)}
									required
								/>
							</div>
							<div>
								<Label htmlFor="t-desc">说明</Label>
								<Input
									id="t-desc"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
								/>
							</div>
						</div>
						<div>
							<Label htmlFor="t-questions">问题树 JSON *</Label>
							<Textarea
								id="t-questions"
								value={questionsJson}
								onChange={(e) => setQuestionsJson(e.target.value)}
								rows={16}
								className="font-mono text-xs"
								spellCheck={false}
							/>
							{jsonError && (
								<p className="text-sm text-destructive mt-1">{jsonError}</p>
							)}
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsOpen(false)}>
							取消
						</Button>
						<Button onClick={handleSubmit} disabled={submitting}>
							{submitting ? "保存中..." : editing ? "保存为新版本" : "创建"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
