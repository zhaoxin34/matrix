"use client";

import { useEffect, useState } from "react";
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
			<h1 className="text-3xl font-bold mb-6">问答库</h1>
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
				<EmptyState title="暂无问题" description="通过访谈或导入来生成问题" />
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
