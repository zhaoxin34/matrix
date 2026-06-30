"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { listQuestionTrees } from "@/lib/api/knlg-base/qa";
import type { QuestionTree } from "@/lib/api/knlg-base/_base";

export default function QuestionTemplatesPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const [trees, setTrees] = useState<QuestionTree[]>([]);

	useEffect(() => {
		(async () => {
			try {
				const data = await listQuestionTrees(workspaceCode);
				setTrees(data.items);
			} catch (e) {
				console.error(e);
			}
		})();
	}, [workspaceCode]);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold">问题树模板</h1>
				<Button>新建模板</Button>
			</div>
			<div className="space-y-2">
				{trees.map((tree) => (
					<Card key={tree.id}>
						<CardHeader>
							<div className="flex justify-between items-center">
								<h2 className="font-semibold">{tree.name}</h2>
								<span className="text-xs text-muted-foreground">
									v{tree.version}
								</span>
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-sm text-muted-foreground mb-2">
								领域：{tree.domain}
							</div>
							<p className="text-sm">{tree.description}</p>
						</CardContent>
					</Card>
				))}
				{trees.length === 0 && (
					<p className="text-muted-foreground text-center py-8">暂无模板</p>
				)}
			</div>
		</div>
	);
}
