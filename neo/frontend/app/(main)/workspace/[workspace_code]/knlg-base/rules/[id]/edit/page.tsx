"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getRule, updateRule } from "@/lib/api/knlg-base/rule";
import type { Rule } from "@/lib/api/knlg-base/_base";

export default function EditRulePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceCode = params.workspace_code as string;
  const id = parseInt(params.id as string);

  const [rule, setRule] = useState<Rule | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setRule(await getRule(workspaceCode, id));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [workspaceCode, id]);

  if (!rule) return <p>加载中...</p>;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await updateRule(workspaceCode, id, {
        name: form.get("name") as string,
        description: (form.get("description") as string) || undefined,
        confidence: parseFloat((form.get("confidence") as string) || "0.5"),
      });
      router.push(
        `/workspace/${workspaceCode}/knlg-base/rules/${id}` as `/${string}`,
      );
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "更新失败");
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">编辑规则</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">名称</Label>
          <Input id="name" name="name" defaultValue={rule.name} required />
        </div>
        <div>
          <Label htmlFor="description">说明</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={rule.description || ""}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="confidence">置信度</Label>
          <Input
            id="confidence"
            name="confidence"
            type="number"
            min="0"
            max="1"
            step="0.05"
            defaultValue={rule.confidence}
          />
        </div>
        {error && <p className="text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit">更新</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}
