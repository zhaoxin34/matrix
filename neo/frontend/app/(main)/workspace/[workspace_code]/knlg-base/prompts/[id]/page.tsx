"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getPrompt,
  renderPrompt,
  type KnlgPrompt,
} from "@/lib/api/knlg-base/prompts";

/**
 * Phase 3 §11.3 — Prompt 编辑页
 *  - 中央：Monaco Editor（Jinja2 语法高亮）
 *  - 右：变量声明面板 + 试运行按钮
 *  - 试运行：调 POST /prompts/render 显示 preview
 */
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      加载编辑器中...
    </div>
  ),
});

export default function PromptDetailPage() {
  const params = useParams();
  const workspaceCode = params.workspace_code as string;
  const promptId = Number(params.id);

  const [prompt, setPrompt] = useState<KnlgPrompt | null>(null);
  const [template, setTemplate] = useState("");
  const [vars, setVars] = useState<Record<string, string>>({});
  const [rendered, setRendered] = useState<string>("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(promptId)) return;
    getPrompt({ workspaceCode, promptId })
      .then((p) => {
        setPrompt(p);
        setTemplate(p.template);
        const initial: Record<string, string> = {};
        for (const v of p.variables) initial[v.key] = v.default != null ? String(v.default) : "";
        setVars(initial);
      })
      .catch((e) => toast.error(`读取失败: ${e.message ?? e}`));
  }, [workspaceCode, promptId]);

  const tryRun = async () => {
    if (!prompt) return;
    setRunning(true);
    try {
      const r = await renderPrompt({ workspaceCode, req: { prompt_id: prompt.id, variables: vars } });
      setRendered(r.rendered);
      toast.success(r.cached ? "命中缓存" : "渲染成功");
    } catch (e) {
      toast.error(`试运行失败: ${(e as Error).message ?? e}`);
    } finally {
      setRunning(false);
    }
  };

  if (!prompt) {
    return <div className="container mx-auto p-6">加载中...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/workspace/${workspaceCode}/knlg-base/prompts`} className="text-sm hover:underline">
            ← 返回列表
          </Link>
          <h1 className="text-2xl font-bold">{prompt.key}</h1>
          <Badge variant="outline">v{prompt.version}</Badge>
          <Badge variant={prompt.status === "active" ? "default" : "secondary"}>{prompt.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">模板</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[60vh] border-y">
              <MonacoEditor
                height="100%"
                language="python"
                value={template}
                onChange={(v) => setTemplate(v ?? "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">变量</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prompt.variables.length === 0 ? (
              <div className="text-sm text-muted-foreground">未声明变量</div>
            ) : (
              prompt.variables.map((v) => (
                <div key={v.key} className="space-y-1">
                  <Label htmlFor={`var-${v.key}`}>{v.key}</Label>
                  <Input
                    id={`var-${v.key}`}
                    value={vars[v.key] ?? ""}
                    onChange={(e) =>
                      setVars((prev) => ({ ...prev, [v.key]: e.target.value }))
                    }
                    placeholder={v.description ?? v.key}
                  />
                </div>
              ))
            )}
            <Button onClick={tryRun} disabled={running} className="w-full">
              {running ? "渲染中..." : "试运行"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {rendered && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">渲染结果</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded">
              {rendered}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}