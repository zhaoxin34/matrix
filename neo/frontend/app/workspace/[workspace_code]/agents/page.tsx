"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AgentFactoryHeader } from "@/components/agent-factory/agent-factory-header";
import { AgentFactoryCard } from "@/components/agent-factory/agent-factory-card";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Folder02Icon } from "@hugeicons/core-free-icons";
import type { AgentStatus } from "@/components/agent-factory/agent-factory-types";
import { mockAgents } from "@/mockdata/workspace/agent-factory";

/**
 * Agent Factory List Page
 *
 * 路由: /workspace/{workspace_code}/agents
 * 角色: Workspace 成员
 * 功能: 展示当前 Workspace 下所有 Agent，支持搜索、筛选、新建
 */
export default function AgentFactoryListPage() {
  const params = useParams();
  const workspaceCode = params.workspace_code as string;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "all">("all");

  // Client-side filtering
  const filteredAgents = mockAgents.filter((agent) => {
    const matchesSearch =
      !search ||
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-medium">Agent 列表</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理当前 Workspace 下的所有 Agent 实例
          </p>
        </div>
      </div>

      <AgentFactoryHeader
        onSearch={setSearch}
        onStatusFilter={setStatusFilter}
        currentStatus={statusFilter}
        createUrl={`/workspace/${workspaceCode}/agents/create`}
      />

      {filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <HugeiconsIcon
              icon={Folder02Icon}
              strokeWidth={1.5}
              className="size-12 text-muted-foreground/50 mb-4"
            />
            <h3 className="text-sm font-medium mb-1">暂无 Agent</h3>
            <p className="text-sm text-muted-foreground mb-4">
              点击新建按钮创建第一个 Agent
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <AgentFactoryCard
              key={agent.id}
              agent={agent}
              workspaceCode={workspaceCode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
