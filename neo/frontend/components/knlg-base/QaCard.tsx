"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Question } from "@/lib/api/knlg-base/_base";

export function QaCard({
	question,
	workspaceCode,
}: {
	question: Question;
	workspaceCode: string;
}) {
	return (
		<Card className="p-4 hover:bg-accent transition">
			<Link
				href={
					`/workspace/${workspaceCode}/knlg-base/qa/questions/${question.id}` as `/${string}`
				}
			>
				<div className="flex items-start justify-between gap-2">
					<p className="text-sm flex-1">{question.text}</p>
					<div className="flex gap-2 shrink-0">
						<Badge variant="outline">{question.status}</Badge>
						<Badge variant="secondary">
							{question.interview_count ?? 0} 访谈
						</Badge>
					</div>
				</div>
				{question.tags && question.tags.length > 0 && (
					<div className="mt-2 flex gap-1 flex-wrap">
						{question.tags.slice(0, 5).map((t) => (
							<Badge key={t} variant="outline" className="text-xs">
								{t}
							</Badge>
						))}
					</div>
				)}
			</Link>
		</Card>
	);
}
