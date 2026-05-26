/**
 * Embedded Site List Page
 *
 * 路由: /workspace/{workspace_code}/list
 * 功能: 展示 embedded-site，支持搜索和状态过滤
 */

import { EmbeddedSiteList } from "@/components/embedded-site";

interface EmbeddedSiteListPageProps {
  params: Promise<{
    workspace_code: string;
  }>;
}

export default async function EmbeddedSiteListPage({
  params,
}: EmbeddedSiteListPageProps) {
  const { workspace_code } = await params;

  // TODO: 根据 workspace_code 获取 workspace_id
  // 目前使用 mock 数据
  const workspaceId = 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-medium">嵌入网站</h1>
          <p className="text-xs text-muted-foreground mt-1">
            管理可以被 Agent 嵌入和学习的网站
          </p>
        </div>
      </div>

      {/* Site List Component */}
      <EmbeddedSiteList
        workspaceId={workspaceId}
        workspaceCode={workspace_code}
      />
    </div>
  );
}