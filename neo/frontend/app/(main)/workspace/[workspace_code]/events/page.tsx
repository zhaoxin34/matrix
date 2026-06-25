/**
 * Event List Page
 *
 * 路由: /workspace/{workspace_code}/events
 * 功能: 展示用户行为事件
 */

import { EventList } from "@/components/event";

interface EventListPageProps {
  params: Promise<{
    workspace_code: string;
  }>;
}

export default async function EventListPage({ params }: EventListPageProps) {
  const { workspace_code } = await params;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-medium">事件</h1>
          <p className="text-xs text-muted-foreground mt-1">
            查看用户在系统中的操作行为记录
          </p>
        </div>
      </div>

      {/* Event List Component */}
      <EventList workspaceCode={workspace_code} />
    </div>
  );
}
