"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getInterview } from "@/lib/api/knlg-base/qa";
import type { Interview, InterviewTurn } from "@/lib/api/knlg-base/_base";

export default function InterviewDetailPage() {
  const params = useParams();
  const workspaceCode = params.workspace_code as string;
  const id = parseInt(params.id as string);

  const [interview, setInterview] = useState<Interview | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setInterview(await getInterview(workspaceCode, id));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [workspaceCode, id]);

  if (!interview) return <p>加载中...</p>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">访谈 #{interview.id}</h1>
      <p className="text-muted-foreground mb-6">
        模式: {interview.mode} | 开始:{" "}
        {interview.started_at
          ? new Date(interview.started_at).toLocaleString()
          : "-"}
      </p>
      <div className="space-y-3">
        {(interview.turns || []).map((turn: InterviewTurn) => (
          <Card key={turn.id}>
            <CardHeader>
              <div className="text-xs text-muted-foreground">
                #{turn.sequence} - {turn.type}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  问题
                </div>
                <p>{turn.question}</p>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  回答
                </div>
                <p className="whitespace-pre-wrap">{turn.answer}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!interview.turns || interview.turns.length === 0) && (
          <p className="text-muted-foreground text-center py-8">暂无问答内容</p>
        )}
      </div>
    </div>
  );
}
