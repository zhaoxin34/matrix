"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listEvidences } from "@/lib/api/knlg-base/rule";

interface Evidence {
  id: number;
  case_source: string;
  case_id: number;
  outcome: string | null;
  matched_rule: boolean;
  support_score: number;
  validated_at: string;
  validator_type: string;
}

export default function RuleEvidencesPage() {
  const params = useParams();
  const workspaceCode = params.workspace_code as string;
  const id = parseInt(params.id as string);

  const [evidences, setEvidences] = useState<Evidence[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await listEvidences(workspaceCode, id);
        setEvidences(data.items as unknown as Evidence[]);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [workspaceCode, id]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">证据列表</h1>
        <Button asChild variant="outline">
          <Link
            href={
              `/workspace/${workspaceCode}/knlg-base/rules/${id}` as `/${string}`
            }
          >
            返回规则
          </Link>
        </Button>
      </div>
      {evidences.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          暂无证据（P2+ 由触发引擎生成）
        </p>
      ) : (
        <div className="space-y-2">
          {evidences.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="font-medium">
                      {e.case_source} #{e.case_id}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(e.validated_at).toLocaleString()}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${e.matched_rule ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {e.matched_rule ? "匹配" : "不匹配"} ({e.support_score})
                  </span>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                验证方式: {e.validator_type}
                {e.outcome && <div className="mt-1">结果: {e.outcome}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
