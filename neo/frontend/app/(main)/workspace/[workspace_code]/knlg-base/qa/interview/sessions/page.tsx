"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listAiSessions, type AiSession } from "@/lib/api/knlg-base/ai";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
	draft: { label: "草稿", color: "bg-gray-100" },
	ai_probing: { label: "AI 追问中", color: "bg-blue-100 text-blue-800" },
	waiting_for_context: {
		label: "等待上下文",
		color: "bg-yellow-100 text-yellow-800",
	},
	ai_summarizing: { label: "总结中", color: "bg-purple-100 text-purple-800" },
	completed: { label: "已完成", color: "bg-green-100 text-green-800" },
	paused: { label: "已暂停", color: "bg-orange-100 text-orange-800" },
	abandoned: { label: "已放弃", color: "bg-red-100 text-red-800" },
};

export default function AiInterviewListPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const router = useRouter();
	const [items, setItems] = useState<AiSession[]>([]);
	const [loading, setLoading] = useState(true);
	const [topic, setTopic] = useState("");

	useEffect(() => {
		(async () => {
			setLoading(true);
			try {
				const data = await listAiSessions(workspaceCode);
				setItems(data.items ?? []);
			} finally {
				setLoading(false);
			}
		})();
	}, [workspaceCode]);

	const onCreate = async () => {
		const text = topic.trim();
		if (!text) return;
		const { createAiSession } = await import("@/lib/api/knlg-base/ai");
		const sess = await createAiSession(workspaceCode, {
			topic: text,
			max_turns: 8,
		});
		setTopic("");
		router.push(
			`/workspace/${workspaceCode}/knlg-base/qa/interview/sessions/${sess.id}`,
		);
	};

	return (
		<div className="space-y-4 p-6 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold">AI 访谈 Sessions</h1>

			<Card>
				<CardHeader>
					<CardTitle className="text-sm">新建 AI 访谈</CardTitle>
				</CardHeader>
				<CardContent className="flex gap-2">
					<input
						className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						placeholder="访谈主题（如：客户商机判断）"
						value={topic}
						onChange={(e) => setTopic(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && onCreate()}
					/>
					<Button onClick={onCreate}>启动</Button>
				</CardContent>
			</Card>

			{loading ? (
				<p>加载中...</p>
			) : items.length === 0 ? (
				<p className="text-muted-foreground">暂无 AI 访谈会话</p>
			) : (
				<div className="grid gap-3">
					{items.map((s) => {
						const meta = STATUS_LABELS[s.status] ?? {
							label: s.status,
							color: "bg-gray-100",
						};
						return (
							<Link
								key={s.id}
								href={`/workspace/${workspaceCode}/knlg-base/qa/interview/sessions/${s.id}`}
								className="block"
							>
								<Card className="hover:bg-accent transition">
									<CardContent className="p-4 flex items-center justify-between">
										<div>
											<div className="font-medium">
												#{s.id} · {s.topic}
											</div>
											<div className="text-xs text-muted-foreground mt-1">
												轮数 {s.current_turn_index}/{s.max_turns} · 创建于{" "}
												{new Date(s.created_at).toLocaleString()}
											</div>
										</div>
										<Badge className={meta.color}>{meta.label}</Badge>
									</CardContent>
								</Card>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
