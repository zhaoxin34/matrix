"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FollowupReasonPanel } from "@/components/knlg-base/ai/FollowupReasonPanel";
import { SignalChip } from "@/components/knlg-base/ai/SignalChip";
import { ThinkingIndicator } from "@/components/knlg-base/ai/ThinkingIndicator";
import { useInterviewStream } from "@/lib/hooks/use-interview-stream";

export default function AiInterviewDetailPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const sessionId = Number(params.id);
	const [answer, setAnswer] = useState("");
	const { messages, thinking, done, error, submitAnswer } = useInterviewStream({
		workspaceCode,
		sessionId,
	});

	const onSubmit = () => {
		const text = answer.trim();
		if (!text) return;
		submitAnswer(text);
		setAnswer("");
	};

	return (
		<div className="space-y-4 p-6 max-w-3xl mx-auto">
			<h1 className="text-2xl font-bold">AI 访谈 Session #{sessionId}</h1>

			{messages.length === 0 && !thinking && (
				<Card>
					<CardContent className="p-6 text-muted-foreground">
						等待 AI 准备第一个问题...
					</CardContent>
				</Card>
			)}

			{messages.map((m) => (
				<Card
					key={m.id}
					className={
						m.role === "ai"
							? "bg-blue-50"
							: m.role === "expert"
								? "bg-green-50"
								: "bg-muted"
					}
				>
					<CardHeader className="pb-2">
						<CardTitle className="text-xs uppercase text-muted-foreground">
							{m.role === "ai"
								? "🤖 AI"
								: m.role === "expert"
									? "👤 专家"
									: "ℹ️ 系统"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="whitespace-pre-wrap">{m.content}</div>
						{m.signals && m.signals.length > 0 && (
							<div className="mt-3 flex flex-wrap gap-2">
								{m.signals.map((s, i) => (
									<SignalChip
										key={i}
										type={s.type}
										confidence={s.confidence}
										text={s.text}
									/>
								))}
							</div>
						)}
						{m.role === "ai" && m.followupReason && (
							<div className="mt-3">
								<FollowupReasonPanel
									reason={m.followupReason}
									rationale={m.rationale}
								/>
							</div>
						)}
					</CardContent>
				</Card>
			))}

			{thinking && <ThinkingIndicator />}
			{error && <div className="text-red-500 text-sm">错误：{error}</div>}

			{!done && !thinking && messages.some((m) => m.role === "ai") && (
				<div className="flex gap-2 sticky bottom-0 bg-background pt-2">
					<Input
						placeholder="输入你的回答..."
						value={answer}
						onChange={(e) => setAnswer(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && onSubmit()}
					/>
					<Button onClick={onSubmit}>发送</Button>
				</div>
			)}
		</div>
	);
}
