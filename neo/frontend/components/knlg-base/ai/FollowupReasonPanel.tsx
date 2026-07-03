"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REASON_LABELS: Record<string, string> = {
  tree_next: "问题树·下一题",
  tree_followup: "问题树·追问",
  too_short: "回答过短",
  too_vague: "回答模糊",
  missing_example: "缺少示例",
  missing_metric: "缺少指标",
  high_signal: "高置信信号",
  low_signal: "低置信信号",
  max_turns_reached: "已达最大轮数",
  expert_request_pause: "专家请求暂停",
};

export function FollowupReasonPanel({
  reason,
  rationale,
}: {
  reason?: string;
  rationale?: string;
}) {
  if (!reason && !rationale) return null;
  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase text-muted-foreground">
          追问原因
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {reason && (
          <div className="font-medium">{REASON_LABELS[reason] ?? reason}</div>
        )}
        {rationale && (
          <div className="text-muted-foreground mt-1">{rationale}</div>
        )}
      </CardContent>
    </Card>
  );
}
