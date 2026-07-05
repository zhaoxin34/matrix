"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QaCard } from "@/components/knlg-base/QaCard";
import { EmptyState } from "@/components/knlg-base/EmptyState";
import { listQuestions } from "@/lib/api/knlg-base/qa";
import type { Question } from "@/lib/api/knlg-base/_base";

export default function QaListPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const [items, setItems] = useState<Question[]>([]);
	const [keyword, setKeyword] = useState("");
	const [loading, setLoading] = useState(false);

	const fetchData = async () => {
		setLoading(true);
		try {
			const data = await listQuestions(workspaceCode, {
				keyword: keyword || undefined,
			});
			setItems(data.items);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [workspaceCode]);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold">问答库</h1>
				<div className="flex gap-2 flex-wrap">
					<Button variant="outline" asChild>
						<Link
							href={
								`/workspace/${workspaceCode}/knlg-base/qa/templates` as `/${string}`
							}
						>
							问题树模板
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link
							href={
								`/workspace/${workspaceCode}/knlg-base/qa/stats` as `/${string}`
							}
						>
							数据看板
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link
							href={
								`/workspace/${workspaceCode}/knlg-base/qa/sessions` as `/${string}`
							}
						>
							访谈会话
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link
							href={
								`/workspace/${workspaceCode}/knlg-base/qa/interviews` as `/${string}`
							}
						>
							访谈记录
						</Link>
					</Button>
					<Button asChild>
						<Link
							href={
								`/workspace/${workspaceCode}/knlg-base/qa/sessions/new` as `/${string}`
							}
						>
							<Plus className="mr-2 h-4 w-4" />
							新建访谈
						</Link>
					</Button>
				</div>
			</div>
			<div className="flex gap-2 mb-4">
				<Input
					placeholder="搜索问题"
					value={keyword}
					onChange={(e) => setKeyword(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && fetchData()}
					className="max-w-md"
				/>
				<Button onClick={fetchData}>搜索</Button>
			</div>
			{loading ? (
				<p>加载中...</p>
			) : items.length === 0 ? (
				<EmptyState
					title="暂无问题"
					description="问答是通过 AI 访谈自动产生的。先选一个模板，再开始一次访谈。"
					action={
						<div className="flex gap-2 justify-center">
							<Button variant="outline" asChild>
								<Link
									href={
										`/workspace/${workspaceCode}/knlg-base/qa/templates` as `/${string}`
									}
								>
									查看模板
								</Link>
							</Button>
							<Button asChild>
								<Link
									href={
										`/workspace/${workspaceCode}/knlg-base/qa/sessions/new` as `/${string}`
									}
								>
									<Plus className="mr-2 h-4 w-4" />
									新建访谈
								</Link>
							</Button>
						</div>
					}
				/>
			) : (
				<div className="space-y-2">
					{items.map((q) => (
						<QaCard key={q.id} question={q} workspaceCode={workspaceCode} />
					))}
				</div>
			)}
		</div>
	);
}
