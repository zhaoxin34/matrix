"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Stats {
	total_questions: number;
	total_interviews: number;
	total_turns: number;
	total_turn_refs: number;
	top_contributors: Array<{
		user_id: number;
		username: string | null;
		turn_count: number;
		total_contributions: number;
	}>;
	top_domains: Array<{
		domain: string;
		question_count: number;
	}>;
	answered_rate: number;
}

export default function StatsPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const [stats, setStats] = useState<Stats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const raw = localStorage.getItem("neo-auth");
				const parsed = raw ? JSON.parse(raw) : null;
				const token = parsed?.user?.token ?? parsed?.state?.user?.token ?? null;
				if (!token) {
					setLoading(false);
					return;
				}
				const resp = await fetch(
					`/api/v1/workspaces/${workspaceCode}/knlg-base/qa/stats/summary`,
					{
						headers: { Authorization: `Bearer ${token}` },
						credentials: "include",
					},
				);
				const data = await resp.json();
				if (data.code === 0) setStats(data.data);
			} catch (e) {
				console.error("[stats] fetch failed:", e);
			} finally {
				setLoading(false);
			}
		})();
	}, [workspaceCode]);

	if (loading) return <p>加载中...</p>;
	if (!stats) return <p>暂无数据</p>;

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold">数据看板（Phase 2 W7）</h1>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							问题数
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{stats.total_questions}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							访谈数
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{stats.total_interviews}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							问答数
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{stats.total_turns}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							已回答率
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							{(stats.answered_rate * 100).toFixed(0)}%
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card>
					<CardHeader>
						<CardTitle>贡献者排行（Top 5）</CardTitle>
					</CardHeader>
					<CardContent>
						{stats.top_contributors.length === 0 ? (
							<p className="text-muted-foreground text-sm">暂无数据</p>
						) : (
							<ul className="space-y-2">
								{stats.top_contributors.map((c, i) => (
									<li
										key={c.user_id}
										className="flex items-center justify-between text-sm"
									>
										<div className="flex items-center gap-2">
											<Badge variant="outline">#{i + 1}</Badge>
											<span>{c.username || `user#${c.user_id}`}</span>
										</div>
										<span className="text-muted-foreground">
											{c.turn_count} 问答
										</span>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>领域分布（Top 10）</CardTitle>
					</CardHeader>
					<CardContent>
						{stats.top_domains.length === 0 ? (
							<p className="text-muted-foreground text-sm">暂无数据</p>
						) : (
							<ul className="space-y-2">
								{stats.top_domains.map((d) => (
									<li
										key={d.domain}
										className="flex items-center justify-between text-sm"
									>
										<Badge variant="secondary">{d.domain}</Badge>
										<span className="text-muted-foreground">
											{d.question_count} 问题
										</span>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
