"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listInterviewSessions } from "@/lib/api/knlg-base/qa";
import type { InterviewSession } from "@/lib/api/knlg-base/_base";

export default function InterviewSessionsPage() {
  const params = useParams();
  const workspaceCode = params.workspace_code as string;
  const [items, setItems] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await listInterviewSessions(workspaceCode);
        setItems(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [workspaceCode]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">访谈会话</h1>
        <Button asChild>
          <Link
            href={
              `/workspace/${workspaceCode}/knlg-base/qa/sessions/new` as `/${string}`
            }
          >
            新建会话
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">加载中...</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            暂无访谈会话
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((s) => (
            <Link
              key={s.id}
              href={
                `/workspace/${workspaceCode}/knlg-base/qa/interviews/${s.id}` as `/${string}`
              }
              className="block"
            >
              <Card className="hover:bg-accent transition">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      #{s.id} · {s.topic}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      模式: {s.mode} ·{" "}
                      {s.started_at
                        ? `开始于 ${new Date(s.started_at).toLocaleString()}`
                        : "未开始"}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {s.interviews?.length ?? 0} 访谈
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
