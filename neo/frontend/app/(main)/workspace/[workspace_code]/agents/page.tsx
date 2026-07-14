"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AgentFactoryHeader } from "@/components/agent-factory/agent-factory-header";
import { AgentFactoryCard } from "@/components/agent-factory/agent-factory-card";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Folder02Icon } from "@hugeicons/core-free-icons";
import type {
  AgentStatus,
  Agent,
} from "@/components/agent-factory/agent-factory-types";
import { listAgents } from "@/lib/api/agent";
import type { AgentResponse } from "@/lib/api/agent";
import { mockSkills } from "@/mockdata/workspace/agent-factory";

// Convert API response to component type
function convertToAgent(response: AgentResponse): Agent {
  // 将 API 返回的 AgentSkillRef[] 转成组件所需的 Skill[]，通过 mockSkills 反查 code/name。
  // 这里只在列表页做轻量映射，缺失时降级使用占位值以避免渲染对象。
  const skills = response.skills.map((ref) => {
    const meta = mockSkills.find((s) => s.id === ref.skill_id);
    return {
      id: ref.skill_id,
      code: meta?.code ?? `skill_${ref.skill_id}`,
      name: meta?.name ?? `技能 #${ref.skill_id}`,
    };
  });

  return {
    id: response.id,
    name: response.name,
    description: response.description,
    prototype_id: response.prototype_id,
    prototype_version: response.prototype_version,
    workspace_id: response.workspace_id,
    model: response.model,
    skills,
    config: response.config as unknown as Agent["config"],
    status: response.status,
    created_by: response.created_by,
    created_at: response.created_at,
    updated_at: response.updated_at,
    prototype: response.prototype,
  };
}

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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await listAgents(workspaceCode, {
          status: statusFilter !== "all" ? statusFilter : undefined,
        });
        setAgents(response.items.map(convertToAgent));
      } catch (err) {
        console.error("Failed to fetch agents:", err);
        setError(err instanceof Error ? err.message : "获取 Agent 列表失败");
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [workspaceCode, statusFilter]);

  // Client-side search filtering (for immediate feedback while typing)
  const displayAgents = search
    ? agents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(search.toLowerCase()) ||
          agent.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : agents;

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

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-sm text-muted-foreground">加载中...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:underline"
            >
              点击重试
            </button>
          </CardContent>
        </Card>
      ) : displayAgents.length === 0 ? (
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
          {displayAgents.map((agent) => (
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
