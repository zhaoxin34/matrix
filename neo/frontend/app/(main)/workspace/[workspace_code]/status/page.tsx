/**
 * Status List Page
 *
 * 路由: /workspace/{workspace_code}/status
 * 功能: 展示用户行为产生的实体状态快照
 */

import { StatusList } from "@/components/status";

interface StatusListPageProps {
  params: Promise<{
    workspace_code: string;
  }>;
}

export default async function StatusListPage({ params }: StatusListPageProps) {
  const { workspace_code } = await params;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-medium">状态</h1>
          <p className="text-xs text-muted-foreground mt-1">
            查看用户在系统中各实体的状态快照
          </p>
        </div>
      </div>

      {/* Status List Component */}
      <StatusList workspaceCode={workspace_code} />
    </div>
  );
}
