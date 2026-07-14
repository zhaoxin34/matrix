"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createTask } from "@/lib/api/task";

interface Agent {
  id: number;
  name: string;
}

interface Member {
  id: number;
  user_id: number;
  user_name: string;
  role: string;
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
  { value: "urgent", label: "紧急" },
];

export default function CreateTaskPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceCode = params.workspace_code as string;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [agentId, setAgentId] = useState<number | null>(null);
  const [executorId, setExecutorId] = useState<number | null>(null);
  const [priority, setPriority] = useState("medium");
  const [cronExpression, setCronExpression] = useState("");
  const [maxRetry, setMaxRetry] = useState(3);
  const [retryInterval, setRetryInterval] = useState(60);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch workspace info to get workspace_id (API path is /code/{code})
        const workspaceRes = await fetch(
          `/api/v1/workspaces/code/${workspaceCode}`,
        );
        const workspaceData = await workspaceRes.json();
        const workspaceId = workspaceData.data?.id;

        if (workspaceId) {
          // Fetch workspace members using workspace_id
          const membersRes = await fetch(
            `/api/v1/workspaces/${workspaceId}/members?page=1&page_size=100`,
          );
          const membersData = await membersRes.json();
          if (membersData.code === 0 && membersData.data) {
            setMembers(membersData.data.list || membersData.data.items || []);
          }
        }

        // Fetch agents
        const agentsRes = await fetch(
          `/api/v1/workspaces/${workspaceCode}/agents?page=1&page_size=100`,
        );
        const agentsData = await agentsRes.json();
        if (agentsData.code === 0 && agentsData.data) {
          setAgents(agentsData.data.items || []);
        }
      } catch (err) {
        console.error("获取数据失败:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [workspaceCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("请输入任务名称");
      return;
    }

    if (!agentId) {
      setError("请选择执行 Agent");
      return;
    }

    if (!executorId) {
      setError("请选择执行者");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createTask(workspaceCode, {
        name: name.trim(),
        description: description.trim() || undefined,
        content: content.trim() || undefined,
        agent_id: agentId,
        executor_id: executorId,
        priority: priority as "low" | "medium" | "high" | "urgent",
        cron_expression: cronExpression.trim() || undefined,
        max_retry: maxRetry,
        retry_interval: retryInterval,
      });
      router.push(`/workspace/${workspaceCode}/tasks`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/workspace/${workspaceCode}/tasks`}
            className="p-2 hover:bg-muted"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-medium">创建任务</h1>
            <p className="text-sm text-muted-foreground mt-1">
              创建新的周期任务
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-500 bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* 任务名称 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              任务名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入任务名称"
              className="w-full px-3 py-2 border"
              maxLength={100}
            />
          </div>

          {/* 执行 Agent */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              执行 Agent <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="text-sm text-muted-foreground">加载中...</div>
            ) : (
              <select
                value={agentId || ""}
                onChange={(e) => setAgentId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 border"
              >
                <option value="">选择 Agent</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 执行者 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              执行者 <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="text-sm text-muted-foreground">加载中...</div>
            ) : (
              <select
                value={executorId || ""}
                onChange={(e) => setExecutorId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 border"
              >
                <option value="">选择执行者</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user_name} ({member.role})
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              执行者是任务的实际执行者，默认为 Agent Owner
            </p>
          </div>

          {/* 优先级 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">优先级</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`px-3 py-1.5 text-sm border ${
                    priority === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cron 表达式 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Cron 表达式
            </label>
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="0 0 * * * (每天凌晨)"
              className="w-full px-3 py-2 border"
            />
            <p className="text-xs text-muted-foreground mt-1">
              格式: 分 时 日 月 周 (例: 0 0 * * * 每天凌晨)
            </p>
          </div>

          {/* 重试配置 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                最大重试次数
              </label>
              <input
                type="number"
                value={maxRetry}
                onChange={(e) => setMaxRetry(Number(e.target.value))}
                min={0}
                max={10}
                className="w-full px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                重试间隔(秒)
              </label>
              <input
                type="number"
                value={retryInterval}
                onChange={(e) => setRetryInterval(Number(e.target.value))}
                min={0}
                max={3600}
                className="w-full px-3 py-2 border"
              />
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入任务描述（可选）"
              rows={3}
              className="w-full px-3 py-2 border"
              maxLength={500}
            />
          </div>

          {/* 任务内容 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">任务内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入任务具体内容（可选）"
              rows={5}
              className="w-full px-3 py-2 border font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/workspace/${workspaceCode}/tasks`}
            className="px-4 py-2 border hover:bg-muted"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "创建中..." : "创建任务"}
          </button>
        </div>
      </form>
    </div>
  );
}
