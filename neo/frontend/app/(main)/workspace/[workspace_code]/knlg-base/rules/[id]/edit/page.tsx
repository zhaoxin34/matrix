"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RuleForm, type RuleFormData } from "@/components/knlg-base/RuleForm";
import { getRule, updateRule } from "@/lib/api/knlg-base/rule";
import type { Rule } from "@/lib/api/knlg-base/_base";

export default function EditRulePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceCode = params.workspace_code as string;
  const id = parseInt(params.id as string);

  const [rule, setRule] = useState<Rule | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getRule(workspaceCode, id);
        setRule(data);
      } catch (e) {
        console.error(e);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [workspaceCode, id]);

  const handleSubmit = async (data: RuleFormData) => {
    setLoading(true);
    try {
      await updateRule(workspaceCode, id, {
        name: data.name,
        description: data.description || undefined,
        trigger: data.trigger,
        conditions: data.conditions,
        conclusion: data.conclusion,
        confidence: data.confidence,
      });
      router.push(
        `/workspace/${workspaceCode}/knlg-base/rules/${id}` as `/${string}`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <p>加载中...</p>;
  }

  if (!rule) {
    return <p>规则不存在</p>;
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">编辑规则</h1>
      <RuleForm
        workspaceCode={workspaceCode}
        initialData={rule}
        onSubmit={handleSubmit}
        submitLabel="保存修改"
        loading={loading}
      />
    </div>
  );
}
