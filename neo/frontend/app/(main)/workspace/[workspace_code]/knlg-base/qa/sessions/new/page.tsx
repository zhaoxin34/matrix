"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInterviewSession } from "@/lib/api/knlg-base/qa";

export default function NewSessionPage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;

	const [expertId, setExpertId] = useState("");
	const [topic, setTopic] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const session = await createInterviewSession(workspaceCode, {
				expert_id: parseInt(expertId),
				topic,
				mode: "manual",
			});
			router.push(
				`/workspace/${workspaceCode}/knlg-base/qa/interviews/${session.id}` as `/${string}`,
			);
		} catch (err: unknown) {
			const e = err as { message?: string };
			setError(e.message || "创建失败");
		}
	};

	return (
		<div className="max-w-xl">
			<h1 className="text-3xl font-bold mb-6">新建访谈会话</h1>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<Label htmlFor="expert_id" className="mb-1.5">
						专家用户 ID *
					</Label>
					<Input
						id="expert_id"
						type="number"
						value={expertId}
						onChange={(e) => setExpertId(e.target.value)}
						required
					/>
				</div>
				<div>
					<Label htmlFor="topic" className="mb-1.5">
						主题 *
					</Label>
					<Input
						id="topic"
						value={topic}
						onChange={(e) => setTopic(e.target.value)}
						required
						maxLength={255}
					/>
				</div>
				{error && <p className="text-red-600">{error}</p>}
				<Button type="submit">创建</Button>
			</form>
		</div>
	);
}
