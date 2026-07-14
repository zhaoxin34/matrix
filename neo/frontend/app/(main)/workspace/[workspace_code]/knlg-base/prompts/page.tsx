"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listPrompts, type KnlgPrompt } from "@/lib/api/knlg-base/prompts";

/**
 * Phase 3 §11.2 — Prompt 列表页
 * Filter: 按 active/deprecated/draft + key
 */
export default function PromptsListPage() {
  const params = useParams();
  const workspaceCode = params.workspace_code as string;

  const [prompts, setPrompts] = useState<KnlgPrompt[]>([]);
  const [status, setStatus] = useState<string>("");
  const [keyFilter, setKeyFilter] = useState<string>("");

  useEffect(() => {
    listPrompts({ status: status || undefined, key: keyFilter || undefined })
      .then((r) => setPrompts(r ?? []))
      .catch(() => setPrompts([]));
  }, [workspaceCode, status, keyFilter]);

  return (
    <div className="container mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prompt 模板</h1>
          <p className="text-sm text-muted-foreground">
            管理 AI 访谈使用的 Prompt（Jinja2 模板），支持版本控制 + 试运行
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">筛选</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">全部状态</option>
            <option value="active">Active</option>
            <option value="deprecated">Deprecated</option>
            <option value="draft">Draft</option>
          </select>
          <input
            value={keyFilter}
            onChange={(e) => setKeyFilter(e.target.value)}
            placeholder="按 key 过滤"
            className="border rounded px-2 py-1 text-sm flex-1"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{prompts.length} 条</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {prompts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              没有匹配的 Prompt
            </div>
          ) : (
            prompts.map((p) => (
              <div
                key={p.id}
                className="py-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/workspace/${workspaceCode}/knlg-base/prompts/${p.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.key}
                    </Link>
                    <Badge variant="outline">v{p.version}</Badge>
                    <Badge
                      variant={p.status === "active" ? "default" : "secondary"}
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {p.variables.length} 个变量 · 更新于{" "}
                    {new Date(p.updated_at).toLocaleString()}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/workspace/${workspaceCode}/knlg-base/prompts/${p.id}`}
                  >
                    编辑
                  </Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
