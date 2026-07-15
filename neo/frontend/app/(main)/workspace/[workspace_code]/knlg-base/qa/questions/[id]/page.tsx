"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/knlg-base/StatusBadge";
import { getQuestion, listInterviews } from "@/lib/api/knlg-base/qa";
import type { Question, Interview } from "@/lib/api/knlg-base/_base";

export default function QuestionDetailPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const id = parseInt(params.id as string);

	const [question, setQuestion] = useState<Question | null>(null);
	const [interviews, setInterviews] = useState<Interview[]>([]);
	const [loadingInterviews, setLoadingInterviews] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				setQuestion(await getQuestion(workspaceCode, id));
			} catch (e) {
				console.error(e);
			}
		})();
	}, [workspaceCode, id]);

	// Load related interviews
	useEffect(() => {
		if (!id) return;

		setLoadingInterviews(true);
		(async () => {
			try {
				const data = await listInterviews(workspaceCode, { question_id: id });
				setInterviews(data);
			} catch (e) {
				console.error("Failed to load interviews:", e);
			} finally {
				setLoadingInterviews(false);
			}
		})();
	}, [workspaceCode, id]);

	if (!question) return <p>加载中...</p>;

	return (
		<div className="max-w-4xl">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-bold flex-1">{question.text}</h1>
				<StatusBadge status={question.status} />
			</div>
			<Card className="mb-4">
				<CardHeader>
					<h2 className="font-semibold">元信息</h2>
				</CardHeader>
				<CardContent className="space-y-1 text-sm">
					<div>
						<span className="text-muted-foreground">领域：</span>
						{question.domain}
					</div>
					<div>
						<span className="text-muted-foreground">优先级：</span>
						{question.priority}
					</div>
					<div>
						<span className="text-muted-foreground">访谈数：</span>
						{question.interview_count ?? 0}
					</div>
					{question.tags && question.tags.length > 0 && (
						<div>
							<span className="text-muted-foreground">标签：</span>
							{question.tags.join(", ")}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Related Interviews */}
			<Card>
				<CardHeader>
					<h2 className="font-semibold">相关访谈</h2>
				</CardHeader>
				<CardContent>
					{loadingInterviews ? (
						<p className="text-muted-foreground text-sm">加载中...</p>
					) : interviews.length === 0 ? (
						<p className="text-muted-foreground text-sm">暂无相关访谈</p>
					) : (
						<div className="space-y-2">
							{interviews.map((i) => (
								<Link
									key={i.id}
									href={`/workspace/${workspaceCode}/knlg-base/qa/interviews/${i.id}`}
									className="block"
								>
									<Card className="p-3 hover:bg-accent transition">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm font-medium">
													#{i.id} - {i.mode}
												</div>
												<div className="text-xs text-muted-foreground">
													{i.started_at
														? new Date(i.started_at).toLocaleString()
														: "未开始"}
												</div>
											</div>
												<Badge variant="outline">
													{i.turns_count ?? 0} 问答
												</Badge>
										</div>
									</Card>
								</Link>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
