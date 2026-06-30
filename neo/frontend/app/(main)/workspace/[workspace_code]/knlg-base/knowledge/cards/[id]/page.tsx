"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/knlg-base/StatusBadge";
import { ConfidenceBadge } from "@/components/knlg-base/ConfidenceBadge";
import { SourceRefList } from "@/components/knlg-base/SourceRefList";
import {
	getKnowledgeCard,
	publishKnowledgeCard,
	deprecateKnowledgeCard,
	listKnowledgeCardSources,
} from "@/lib/api/knlg-base/knowledge";
import type { KnowledgeCard, SourceRef } from "@/lib/api/knlg-base/_base";

export default function KnowledgeCardDetailPage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;
	const id = parseInt(params.id as string);

	const [card, setCard] = useState<KnowledgeCard | null>(null);
	const [sources, setSources] = useState<SourceRef[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const c = await getKnowledgeCard(workspaceCode, id);
				setCard(c);
				const s = await listKnowledgeCardSources(workspaceCode, id);
				setSources(s);
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		})();
	}, [workspaceCode, id]);

	if (loading) return <p>加载中...</p>;
	if (!card) return <p>未找到卡片</p>;

	return (
		<div className="max-w-4xl">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-3xl font-bold">{card.title}</h1>
				<div className="flex gap-2">
					<StatusBadge status={card.status} />
					<ConfidenceBadge value={card.confidence} />
				</div>
			</div>

			<div className="flex gap-2 mb-6">
				<Button asChild variant="outline">
					<Link
						href={
							`/workspace/${workspaceCode}/knlg-base/knowledge/cards/${card.id}/edit` as `/${string}`
						}
					>
						编辑
					</Link>
				</Button>
				<Button asChild variant="outline">
					<Link
						href={
							`/workspace/${workspaceCode}/knlg-base/knowledge/cards/${card.id}/versions` as `/${string}`
						}
					>
						版本历史
					</Link>
				</Button>
				{card.status === "draft" && (
					<Button
						onClick={async () => {
							await publishKnowledgeCard(workspaceCode, card.id);
							router.refresh();
						}}
					>
						发布
					</Button>
				)}
				{card.status === "published" && (
					<Button
						variant="outline"
						onClick={async () => {
							await deprecateKnowledgeCard(workspaceCode, card.id);
							router.refresh();
						}}
					>
						废弃
					</Button>
				)}
			</div>

			<Card className="mb-4">
				<CardHeader>
					<h2 className="text-xl font-semibold">核心陈述</h2>
				</CardHeader>
				<CardContent>
					<p className="whitespace-pre-wrap">{card.statement}</p>
				</CardContent>
			</Card>

			<div className="grid grid-cols-2 gap-4 mb-4">
				<Card>
					<CardHeader>
						<h3 className="font-semibold">元信息</h3>
					</CardHeader>
					<CardContent className="space-y-1 text-sm">
						<div>
							<span className="text-muted-foreground">领域：</span>
							{card.domain}
						</div>
						<div>
							<span className="text-muted-foreground">类型：</span>
							{card.type}
						</div>
						<div>
							<span className="text-muted-foreground">版本：</span>
							{card.version}
						</div>
						<div>
							<span className="text-muted-foreground">校验状态：</span>
							{card.validation_status}
						</div>
						<div>
							<span className="text-muted-foreground">标签：</span>
							{card.tags?.join(", ") || "无"}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<h3 className="font-semibold">条件与例外</h3>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						{card.conditions && (
							<div>
								<div className="text-muted-foreground">适用条件：</div>
								{card.conditions}
							</div>
						)}
						{card.exceptions && (
							<div>
								<div className="text-muted-foreground">例外：</div>
								{card.exceptions}
							</div>
						)}
						{!card.conditions && !card.exceptions && (
							<p className="text-muted-foreground">未设置</p>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<h3 className="font-semibold">来源引用 ({sources.length})</h3>
				</CardHeader>
				<CardContent>
					<SourceRefList refs={sources} />
				</CardContent>
			</Card>
		</div>
	);
}
