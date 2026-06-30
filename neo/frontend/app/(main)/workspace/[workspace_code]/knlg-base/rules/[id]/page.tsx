"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/knlg-base/StatusBadge";
import { ConfidenceBadge } from "@/components/knlg-base/ConfidenceBadge";
import { RuleConditionTree } from "@/components/knlg-base/RuleConditionTree";
import {
	getRule,
	publishRule,
	activateRule,
	pauseRule,
	deprecateRule,
	deleteRule,
} from "@/lib/api/knlg-base/rule";
import type { Rule } from "@/lib/api/knlg-base/_base";

export default function RuleDetailPage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;
	const id = parseInt(params.id as string);

	const [rule, setRule] = useState<Rule | null>(null);

	const fetchData = async () => {
		try {
			setRule(await getRule(workspaceCode, id));
		} catch (e) {
			console.error(e);
		}
	};
	useEffect(() => {
		fetchData();
	}, [workspaceCode, id]);

	if (!rule) return <p>加载中...</p>;

	return (
		<div className="max-w-4xl">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-3xl font-bold flex-1">{rule.name}</h1>
				<div className="flex gap-2 items-center">
					<StatusBadge status={rule.status} />
					<ConfidenceBadge value={rule.confidence} />
				</div>
			</div>
			<div className="flex gap-2 mb-6">
				<Button asChild variant="outline">
					<Link
						href={
							`/workspace/${workspaceCode}/knlg-base/rules/${rule.id}/edit` as `/${string}`
						}
					>
						编辑
					</Link>
				</Button>
				<Button asChild variant="outline">
					<Link
						href={
							`/workspace/${workspaceCode}/knlg-base/rules/${rule.id}/evidences` as `/${string}`
						}
					>
						证据
					</Link>
				</Button>
				{rule.status === "draft" && (
					<Button
						onClick={async () => {
							await publishRule(workspaceCode, id);
							fetchData();
						}}
					>
						发布 (testing)
					</Button>
				)}
				{rule.status === "testing" && (
					<Button
						onClick={async () => {
							await activateRule(workspaceCode, id);
							fetchData();
						}}
					>
						激活
					</Button>
				)}
				{rule.status === "active" && (
					<Button
						variant="outline"
						onClick={async () => {
							await pauseRule(workspaceCode, id);
							fetchData();
						}}
					>
						暂停
					</Button>
				)}
				{rule.status !== "deprecated" && (
					<Button
						variant="outline"
						onClick={async () => {
							await deprecateRule(workspaceCode, id);
							fetchData();
						}}
					>
						废弃
					</Button>
				)}
				<Button
					variant="destructive"
					onClick={async () => {
						if (confirm("确认删除？")) {
							await deleteRule(workspaceCode, id);
							router.push(
								`/workspace/${workspaceCode}/knlg-base/rules` as `/${string}`,
							);
						}
					}}
				>
					删除
				</Button>
			</div>

			<Card className="mb-4">
				<CardHeader>
					<h2 className="font-semibold">说明</h2>
				</CardHeader>
				<CardContent>
					<p>{rule.description || "无"}</p>
				</CardContent>
			</Card>

			<Card className="mb-4">
				<CardHeader>
					<h2 className="font-semibold">触发器</h2>
				</CardHeader>
				<CardContent>
					<pre className="bg-muted p-3 rounded text-sm overflow-auto">
						{JSON.stringify(rule.trigger, null, 2)}
					</pre>
				</CardContent>
			</Card>

			<Card className="mb-4">
				<CardHeader>
					<h2 className="font-semibold">条件</h2>
				</CardHeader>
				<CardContent>
					<RuleConditionTree conditions={rule.conditions} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<h2 className="font-semibold">结论</h2>
				</CardHeader>
				<CardContent>
					<pre className="bg-muted p-3 rounded text-sm overflow-auto">
						{JSON.stringify(rule.conclusion, null, 2)}
					</pre>
				</CardContent>
			</Card>
		</div>
	);
}
