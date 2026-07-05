"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listInterviews } from "@/lib/api/knlg-base/qa";
import type { Interview } from "@/lib/api/knlg-base/_base";

export default function InterviewsPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const [items, setItems] = useState<Interview[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			setLoading(true);
			try {
				const data = await listInterviews(workspaceCode);
				setItems(data);
			} finally {
				setLoading(false);
			}
		})();
	}, [workspaceCode]);

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">访谈记录</h1>

			{loading ? (
				<p className="text-muted-foreground">加载中...</p>
			) : items.length === 0 ? (
				<Card>
					<CardContent className="py-8 text-center text-muted-foreground">
						暂无访谈记录
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-3">
					{items.map((i) => (
						<Link
							key={i.id}
							href={
								`/workspace/${workspaceCode}/knlg-base/qa/interviews/${i.id}` as `/${string}`
							}
							className="block"
						>
							<Card className="hover:bg-accent transition">
								<CardContent className="p-4 flex items-center justify-between">
									<div>
										<div className="font-medium">#{i.id}</div>
										<div className="text-xs text-muted-foreground mt-1">
											模式: {i.mode} ·{" "}
											{i.started_at
												? new Date(i.started_at).toLocaleString()
												: "未开始"}
										</div>
									</div>
									<Badge variant="outline">{i.turns?.length ?? 0} 问答</Badge>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
