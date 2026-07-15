"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, PlayCircleIcon } from "@hugeicons/core-free-icons";
import { ChatWindow } from "@/components/knlg-base/agent-interview/chat-window";
import { useAgentInterview } from "@/lib/hooks/use-agent-interview";
import { listQuestionTrees } from "@/lib/api/knlg-base/qa";
import type { QuestionTree } from "@/lib/api/knlg-base/_base";
import { toast } from "sonner";

type Expert = {
	id: number;
	name: string;
	role: string;
};

const MOCK_EXPERTS: Expert[] = [
	{ id: 1, name: "张三", role: "销售总监" },
	{ id: 2, name: "李四", role: "客户成功经理" },
	{ id: 3, name: "王五", role: "实施顾问" },
];

export default function AgentInterviewPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;

	// Interview state
	const [step, setStep] = useState<"setup" | "interview">("setup");
	const [selectedExpertId, setSelectedExpertId] = useState<number>(1);
	const [selectedTreeId, setSelectedTreeId] = useState<number>(1);
	const [questionTrees, setQuestionTrees] = useState<QuestionTree[]>([]);
	// Agent interview hook
	const {
		messages,
		connected,
		interviewId,
		currentQuestionIndex,
		totalQuestions,
		isComplete,
		error,
		loading: wsLoading,
		startInterview,
		submitAnswer,
		endInterview,
		reconnect,
	} = useAgentInterview({
		workspaceCode,
		expertId: selectedExpertId,
		questionTreeId: selectedTreeId,
		autoConnect: true,
	});

	// Load question trees
	useEffect(() => {
		(async () => {
			try {
				const trees = await listQuestionTrees(workspaceCode);
				setQuestionTrees(trees.items ?? []);
				if (trees.items?.length && !selectedTreeId) {
					setSelectedTreeId(trees.items[0].id);
				}
			} catch (e) {
				console.error("Failed to load question trees:", e);
			}
		})();
	}, [workspaceCode]);

	const handleStartInterview = () => {
		if (!connected) {
			toast.error("正在连接服务器，请稍候...");
			return;
		}
		setStep("interview");
		startInterview();
	};

	const handleEndInterview = () => {
		endInterview();
		setStep("setup");
	};

	const handleBackToSetup = () => {
		handleEndInterview();
		setStep("setup");
	};

	// Setup step - select expert and question tree
	if (step === "setup") {
		return (
			<div className="space-y-6 p-6 max-w-2xl mx-auto">
				{/* Header */}
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href={`/workspace/${workspaceCode}/knlg-base/qa`}>
							<HugeiconsIcon
								icon={ArrowLeft01Icon}
								strokeWidth={1.5}
								className="size-4"
							/>
						</Link>
					</Button>
					<div>
						<h1 className="text-xl font-heading font-medium">AI 专家访谈</h1>
						<p className="text-xs text-muted-foreground mt-1">
							通过 AI 访谈助手与专家对话，采集经验知识
						</p>
					</div>
				</div>

				{/* Connection Status */}
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div
									className={`w-2 h-2 rounded-full ${
										connected ? "bg-green-500" : "bg-yellow-500"
									}`}
								/>
								<span className="text-sm">
									{connected ? "已连接到访谈服务" : "正在连接..."}
								</span>
							</div>
							{wsLoading && (
								<Badge variant="secondary" className="text-xs">
									连接中...
								</Badge>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Expert Selection */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">选择专家</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-3 gap-3">
							{MOCK_EXPERTS.map((expert) => (
								<button
									key={expert.id}
									onClick={() => setSelectedExpertId(expert.id)}
									className={`p-4 rounded-lg border text-left transition-colors ${
										selectedExpertId === expert.id
											? "border-primary bg-primary/5"
											: "border-border hover:bg-muted"
									}`}
								>
									<div className="font-medium">{expert.name}</div>
									<div className="text-xs text-muted-foreground">
										{expert.role}
									</div>
								</button>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Question Tree Selection */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">选择访谈模板</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{questionTrees.length === 0 ? (
							<div className="text-sm text-muted-foreground py-4 text-center">
								暂无可用模板
							</div>
						) : (
							<Select
								value={String(selectedTreeId)}
								onValueChange={(v) => setSelectedTreeId(Number(v))}
							>
								<SelectTrigger>
									<SelectValue placeholder="选择访谈模板" />
								</SelectTrigger>
								<SelectContent>
									{questionTrees.map((tree) => (
										<SelectItem key={tree.id} value={String(tree.id)}>
											<div>
												<div className="font-medium">{tree.name}</div>
												<div className="text-xs text-muted-foreground">
													{tree.description || tree.domain}
												</div>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}

						{/* Preview questions */}
						{selectedTreeId && (
							<div className="mt-4">
								<Label className="text-xs text-muted-foreground">
									预览问题 (
									{questionTrees.find((t) => t.id === selectedTreeId)?.questions
										.length ?? 0}{" "}
									个)
								</Label>
								<div className="mt-2 space-y-2">
									{(
										questionTrees.find((t) => t.id === selectedTreeId)
											?.questions ?? []
									)
										.slice(0, 3)
										.map((q, i) => (
											<div
												key={q.id || i}
												className="text-sm p-2 bg-muted rounded"
											>
												Q{i + 1}: {q.text}
											</div>
										))}
									{(questionTrees.find((t) => t.id === selectedTreeId)
										?.questions.length ?? 0) > 3 && (
										<div className="text-xs text-muted-foreground text-center">
											... 还有{" "}
											{(questionTrees.find((t) => t.id === selectedTreeId)
												?.questions.length ?? 0) - 3}{" "}
											个问题
										</div>
									)}
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Start Button */}
				<Button
					onClick={handleStartInterview}
					disabled={!connected || questionTrees.length === 0}
					className="w-full"
					size="lg"
				>
					<HugeiconsIcon
						icon={PlayCircleIcon}
						strokeWidth={1.5}
						className="size-4 mr-2"
					/>
					开始访谈
				</Button>

			{/* Error Display */}
			{error && (
				<Card className="border-destructive">
					<CardContent className="p-4 flex items-center justify-between">
						<div className="text-sm text-destructive">{error}</div>
						<Button variant="outline" size="sm" onClick={reconnect}>
							重试连接
						</Button>
					</CardContent>
				</Card>
			)}
			</div>
		);
	}

	// Interview step - chat interface
	return (
		<div className="h-[calc(100vh-120px)] flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={handleBackToSetup}>
						<HugeiconsIcon
							icon={ArrowLeft01Icon}
							strokeWidth={1.5}
							className="size-4"
						/>
					</Button>
					<div>
						<h1 className="text-lg font-medium">AI 专家访谈</h1>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span>
								专家:{" "}
								{MOCK_EXPERTS.find((e) => e.id === selectedExpertId)?.name}
							</span>
							{interviewId && (
								<>
									<span>·</span>
									<span className="font-mono">ID: {interviewId}</span>
								</>
							)}
							<span>·</span>
							<span
								className={`flex items-center gap-1 ${
									connected ? "text-green-600" : "text-yellow-600"
								}`}
							>
								<div
									className={`w-1.5 h-1.5 rounded-full ${
										connected ? "bg-green-500" : "bg-yellow-500"
									}`}
								/>
								{connected ? "已连接" : "连接中..."}
							</span>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="outline" className="font-mono">
						{currentQuestionIndex + 1} / {totalQuestions}
					</Badge>
					<Button variant="outline" size="sm" onClick={handleBackToSetup}>
						退出访谈
					</Button>
				</div>
			</div>

			{/* Chat Window */}
			<div className="flex-1 overflow-hidden border rounded-lg m-4">
				<ChatWindow
					messages={messages}
					currentQuestionIndex={currentQuestionIndex}
					totalQuestions={totalQuestions}
					isComplete={isComplete}
					onSubmitAnswer={submitAnswer}
					onEndInterview={handleBackToSetup}
					disabled={!connected}
				/>
			</div>
		</div>
	);
}
