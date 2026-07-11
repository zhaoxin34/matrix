"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RuleForm, type RuleFormData } from "@/components/knlg-base/RuleForm";
import { createRule } from "@/lib/api/knlg-base/rule";

export default function NewRulePage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;

	const [loading, setLoading] = useState(false);

	const handleSubmit = async (data: RuleFormData) => {
		setLoading(true);
		try {
			const rule = await createRule(workspaceCode, {
				name: data.name,
				description: data.description || undefined,
				source_kc_id: data.source_kc_id,
				scope: {},
				trigger: data.trigger,
				conditions: data.conditions,
				conclusion: data.conclusion,
				confidence: data.confidence,
			});
			router.push(
				`/workspace/${workspaceCode}/knlg-base/rules/${rule.id}` as `/${string}`,
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-4xl">
			<h1 className="text-3xl font-bold mb-6">新建规则</h1>
			<RuleForm
				workspaceCode={workspaceCode}
				onSubmit={handleSubmit}
				submitLabel="创建规则"
				loading={loading}
			/>
		</div>
	);
}
