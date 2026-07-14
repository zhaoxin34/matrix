"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/knlg-base/StatusBadge";
import {
  getImportJob,
  updateImportJobStatus,
  cancelImportJob,
} from "@/lib/api/knlg-base/import";
import type { ImportJob } from "@/lib/api/knlg-base/_base";

export default function ImportJobDetailPage() {
  const params = useParams();
  const workspaceCode = params.workspace_code as string;
  const id = parseInt(params.id as string);

  const [job, setJob] = useState<ImportJob | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setJob(await getImportJob(workspaceCode, id));
    } catch (e) {
      console.error(e);
    }
  }, [workspaceCode, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!job) return <p>加载中...</p>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">导入任务 #{job.id}</h1>
        <StatusBadge status={job.status} />
      </div>
      <div className="flex gap-2 mb-4">
        <Button asChild variant="outline">
          <Link
            href={
              `/workspace/${workspaceCode}/knlg-base/import` as `/${string}`
            }
          >
            返回列表
          </Link>
        </Button>
        {job.status === "pending" && (
          <Button
            onClick={async () => {
              await updateImportJobStatus(workspaceCode, id, {
                status: "parsing",
                progress: 0.5,
              });
              fetchData();
            }}
          >
            开始解析（手动）
          </Button>
        )}
        {(job.status === "pending" || job.status === "parsing") && (
          <Button
            variant="outline"
            onClick={async () => {
              await cancelImportJob(workspaceCode, id);
              fetchData();
            }}
          >
            取消
          </Button>
        )}
      </div>

      <Card className="mb-4">
        <CardHeader>
          <h2 className="font-semibold">任务信息</h2>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">文档 ID：</span>
            {job.document_id}
          </div>
          <div>
            <span className="text-muted-foreground">进度：</span>
            {(job.progress * 100).toFixed(0)}%
          </div>
          <div>
            <span className="text-muted-foreground">开始时间：</span>
            {job.started_at ? new Date(job.started_at).toLocaleString() : "-"}
          </div>
          <div>
            <span className="text-muted-foreground">结束时间：</span>
            {job.finished_at ? new Date(job.finished_at).toLocaleString() : "-"}
          </div>
          {job.error_message && (
            <div className="text-red-600">错误：{job.error_message}</div>
          )}
        </CardContent>
      </Card>

      {job.result_summary && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">结果摘要</h2>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded text-sm overflow-auto">
              {JSON.stringify(job.result_summary, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
