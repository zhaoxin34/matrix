"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/knlg-base/StatusBadge";
import { ConfidenceBadge } from "@/components/knlg-base/ConfidenceBadge";
import { listRules } from "@/lib/api/knlg-base/rule";
import type { Rule } from "@/lib/api/knlg-base/_base";

export default function RuleListPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const [items, setItems] = useState<Rule[]>([]);

	useEffect(() => {
		(async () => {
			try {
				const data = await listRules(workspaceCode);
				setItems(data.items);
			} catch (e) {
				console.error(e);
			}
		})();
	}, [workspaceCode]);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold">规则库</h1>
				<Button asChild>
					<Link
						href={
							`/workspace/${workspaceCode}/knlg-base/rules/new` as `/${string}`
						}
					>
						新建规则
					</Link>
				</Button>
			</div>
			<div className="space-y-3">
				{items.map((rule) => (
					<Card key={rule.id}>
						<CardHeader>
							<div className="flex items-center justify-between">
								<Link
									href={
										`/workspace/${workspaceCode}/knlg-base/rules/${rule.id}` as `/${string}`
									}
									className="text-lg font-semibold hover:underline"
								>
									{rule.name}
								</Link>
								<div className="flex gap-2 items-center">
									<StatusBadge status={rule.status} />
									<ConfidenceBadge value={rule.confidence} />
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								{rule.description}
							</p>
						</CardContent>
					</Card>
				))}
				{items.length === 0 && (
					<p className="text-muted-foreground text-center py-8">暂无规则</p>
				)}
			</div>
		</div>
	);
}
