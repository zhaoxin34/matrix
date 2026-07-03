"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listKnowledgeCardVersions } from "@/lib/api/knlg-base/knowledge";

interface Version {
  id: number;
  version: string;
  change_note: string | null;
  changed_by: number;
  created_at: string;
}

export default function KnowledgeCardVersionsPage() {
  const params = useParams();
  const workspaceCode = params.workspace_code as string;
  const id = parseInt(params.id as string);

  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listKnowledgeCardVersions(workspaceCode, id);
        // Backend returns KnowledgeCardListResponse shape but with version fields
        // In P0 we just show id + version + created_at from the snapshot if available
        setVersions(data.items as unknown as Version[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [workspaceCode, id]);

  if (loading) return <p>加载中...</p>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">版本历史</h1>
        <Button asChild variant="outline">
          <Link
            href={
              `/workspace/${workspaceCode}/knlg-base/knowledge/cards/${id}` as `/${string}`
            }
          >
            返回卡片
          </Link>
        </Button>
      </div>

      {versions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            暂无版本历史
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <Card key={v.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">版本 {v.version}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(v.created_at).toLocaleString()}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  by user {v.changed_by}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
