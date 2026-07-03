"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/knlg-base/StatusBadge";
import { getQuestion } from "@/lib/api/knlg-base/qa";
import type { Question } from "@/lib/api/knlg-base/_base";

export default function QuestionDetailPage() {
  const params = useParams();
  const workspaceCode = params.workspace_code as string;
  const id = parseInt(params.id as string);

  const [question, setQuestion] = useState<Question | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setQuestion(await getQuestion(workspaceCode, id));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [workspaceCode, id]);

  if (!question) return <p>加载中...</p>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex-1">{question.text}</h1>
        <StatusBadge status={question.status} />
      </div>
      <Card className="mb-4">
        <CardHeader>
          <h2 className="font-semibold">元信息</h2>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">领域：</span>
            {question.domain}
          </div>
          <div>
            <span className="text-muted-foreground">优先级：</span>
            {question.priority}
          </div>
          <div>
            <span className="text-muted-foreground">访谈数：</span>
            {question.interview_count ?? 0}
          </div>
          {question.tags && question.tags.length > 0 && (
            <div>
              <span className="text-muted-foreground">标签：</span>
              {question.tags.join(", ")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
