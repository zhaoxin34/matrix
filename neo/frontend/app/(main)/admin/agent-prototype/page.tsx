"use client";

import { useState, useEffect, useRef } from "react";
import { AgentPrototypeHeader } from "@/components/agent-prototype/agent-prototype-header";
import { AgentPrototypeCard } from "@/components/agent-prototype/agent-prototype-card";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Folder02Icon } from "@hugeicons/core-free-icons";
import type { AgentPrototypeStatus } from "@/components/agent-prototype/agent-prototype-types";
import {
  listAgentPrototypes,
  type AgentPrototypeResponse,
  ApiError,
} from "@/lib/api/agent-prototype";

/**
 * Admin Agent Prototype List Page
 *
 * 路由: /admin/agent-prototype
 * 角色: 仅限 admin 角色访问
 * 功能: 展示所有 Agent Prototype 列表，支持搜索、筛选、新建
 */
export default function AdminAgentPrototypeListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    AgentPrototypeStatus | "all"
  >("all");
  const [prototypes, setPrototypes] = useState<AgentPrototypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to avoid stale closure issues
  const statusFilterRef = useRef(statusFilter);
  const searchRef = useRef(search);

  // Keep refs in sync
  useEffect(() => {
    statusFilterRef.current = statusFilter;
  }, [statusFilter]);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  // Fetch prototypes from API
  const fetchPrototypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listAgentPrototypes({
        status: statusFilterRef.current,
        search: searchRef.current || undefined,
        page: 1,
        page_size: 100,
      });
      setPrototypes(response.items);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("获取数据失败");
      }
      console.error("Failed to fetch prototypes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    // Use requestAnimationFrame to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      fetchPrototypes();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when status filter changes (debounced search handled separately)
  useEffect(() => {
    // Use requestAnimationFrame to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      fetchPrototypes();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPrototypes();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Refresh handler for child components
  const handleDataChange = () => {
    fetchPrototypes();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-medium">Agent 原型管理</h1>
          <p className="text-xs text-muted-foreground mt-1">
            创建和管理 Agent 原型模板
          </p>
        </div>
      </div>

      <AgentPrototypeHeader
        onSearch={setSearch}
        onStatusFilter={setStatusFilter}
        currentStatus={statusFilter}
      />

      {/* Error state */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchPrototypes}
              className="text-xs text-red-500 hover:text-red-700 mt-2"
            >
              重试
            </button>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-sm text-muted-foreground">加载中...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && prototypes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <HugeiconsIcon
              icon={Folder02Icon}
              strokeWidth={1.5}
              className="size-12 text-muted-foreground/50 mb-4"
            />
            <h3 className="text-sm font-medium mb-1">暂无 Agent 原型</h3>
            <p className="text-xs text-muted-foreground mb-4">
              点击新建按钮创建第一个 Agent 原型
            </p>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {!loading && !error && prototypes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prototypes.map((prototype) => (
            <AgentPrototypeCard
              key={prototype.id}
              prototype={prototype}
              onDataChange={handleDataChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
