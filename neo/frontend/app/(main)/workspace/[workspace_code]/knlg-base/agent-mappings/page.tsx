"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Edit01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import {
  AGENT_MAPPING_TYPE_LABELS,
  AGENT_MAPPING_TYPE_OPTIONS,
  createAgentMapping,
  deleteAgentMapping,
  listAgentMappings,
  updateAgentMapping,
  type AgentMapping,
  type AgentMappingType,
} from "@/lib/api/agent-mapping";
import { listAgents, type AgentResponse } from "@/lib/api/agent";

/** UI-side form state for the create/edit dialog. `type` is empty until the
 * user picks one from the dropdown. */
type FormState = {
  type: AgentMappingType | "";
  agent_id: string; // bound to <Select>, kept as string for empty state
};

const EMPTY_FORM: FormState = { type: "", agent_id: "" };

export default function AgentMappingsPage() {
  const params = useParams();
  const workspaceCode = params.workspace_code as string;

  // List state
  const [mappings, setMappings] = useState<AgentMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Agent options for the Select (only enabled)
  const [agents, setAgents] = useState<AgentResponse[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AgentMapping | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete-confirmation state
  const [deleting, setDeleting] = useState<AgentMapping | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  // Types already in use — disabled in the create dialog
  const usedTypes = useMemo(() => new Set(mappings.map((m) => m.type)), [mappings]);

  // Initial load: mappings + agents
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setListError(null);
        const [m, a] = await Promise.all([
          listAgentMappings(workspaceCode, { page_size: 100 }),
          listAgents(workspaceCode, { status: "enabled", page_size: 100 }),
        ]);
        if (cancelled) return;
        setMappings(m.items);
        setAgents(a.items);
      } catch (err) {
        if (cancelled) return;
        setListError(err instanceof Error ? err.message : "加载失败");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setAgentsLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceCode]);

  // Quick lookup table for the agent select
  const agentsById = useMemo(() => {
    const m = new Map<number, AgentResponse>();
    for (const a of agents) m.set(a.id, a);
    return m;
  }, [agents]);

  // ---------- Dialog handlers ----------

  function openCreateDialog() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(m: AgentMapping) {
    setEditing(m);
    setForm({ type: m.type, agent_id: String(m.agent_id) });
    setDialogOpen(true);
  }

  function closeDialog() {
    if (submitting) return;
    setDialogOpen(false);
  }

  async function handleSubmit() {
    if (!form.type) {
      toast.error("请选择 type");
      return;
    }
    if (!form.agent_id) {
      toast.error("请选择关联 Agent");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        const updated = await updateAgentMapping(workspaceCode, editing.type, {
          agent_id: Number(form.agent_id),
        });
        setMappings((prev) =>
          prev.map((m) =>
            m.workspace_id === updated.workspace_id && m.type === updated.type
              ? updated
              : m,
          ),
        );
        toast.success("已更新");
      } else {
        const created = await createAgentMapping(workspaceCode, {
          type: form.type,
          agent_id: Number(form.agent_id),
        });
        setMappings((prev) => [...prev, created]);
        toast.success("已创建");
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Delete handlers ----------

  function openDeleteConfirm(m: AgentMapping) {
    setDeleting(m);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await deleteAgentMapping(workspaceCode, deleting.type);
      setMappings((prev) =>
        prev.filter((m) => m.type !== deleting.type),
      );
      toast.success("已删除");
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败");
    } finally {
      setDeletingBusy(false);
    }
  }

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-medium">Agent 映射</h1>
          <p className="text-sm text-muted-foreground mt-1">
            将 type（与 agent_prototype.type 对齐）绑定到具体的 Agent 实例
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          disabled={usedTypes.size >= AGENT_MAPPING_TYPE_OPTIONS.length}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          新建映射
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-sm text-muted-foreground">加载中...</p>
          </CardContent>
        </Card>
      ) : listError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-destructive mb-2">{listError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:underline"
            >
              点击重试
            </button>
          </CardContent>
        </Card>
      ) : mappings.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>暂无映射</CardTitle>
            <CardDescription>
              点击右上角「新建映射」创建第一个 type → Agent 绑定
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium w-1/3">type</th>
                <th className="px-4 py-3 text-left font-medium">关联 Agent</th>
                <th className="px-4 py-3 text-right font-medium w-32">操作</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => {
                const agent = agentsById.get(m.agent_id);
                return (
                  <tr key={`${m.workspace_id}:${m.type}`} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono">
                      {AGENT_MAPPING_TYPE_LABELS[m.type] ?? m.type}
                    </td>
                    <td className="px-4 py-3">
                      {agent ? (
                        <span>
                          {agent.name}
                          <span className="text-muted-foreground text-xs ml-2">
                            #{agent.id}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Agent #{m.agent_id}（已删除或不可见）
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(m)}
                          aria-label="编辑"
                        >
                          <HugeiconsIcon
                            icon={Edit01Icon}
                            strokeWidth={2}
                            className="size-4"
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteConfirm(m)}
                          aria-label="删除"
                        >
                          <HugeiconsIcon
                            icon={Delete01Icon}
                            strokeWidth={2}
                            className="size-4 text-destructive"
                          />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? null : closeDialog())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑映射" : "新建映射"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "type 不可修改，只能切换关联的 Agent"
                : "type 须与 agent_prototype.type 对齐，每个 type 在此 workspace 内仅可配置一次"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as AgentMappingType }))
                }
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择 type" />
                </SelectTrigger>
                <SelectContent>
                  {AGENT_MAPPING_TYPE_OPTIONS.map((t) => {
                    const used = !editing && usedTypes.has(t);
                    return (
                      <SelectItem
                        key={t}
                        value={t}
                        disabled={used}
                        className={used ? "opacity-50" : ""}
                      >
                        {AGENT_MAPPING_TYPE_LABELS[t]}
                        {used ? "（已配置）" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>关联 Agent</Label>
              <Select
                value={form.agent_id}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, agent_id: v }))
                }
                disabled={agentsLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={agentsLoading ? "加载中..." : "请选择 Agent"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {agents.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-muted-foreground">
                      当前 workspace 暂无启用的 Agent
                    </div>
                  ) : (
                    agents.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name} #{a.id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "保存中..." : editing ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && !deletingBusy && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除映射？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除 type=
              <span className="font-mono">
                {deleting ? AGENT_MAPPING_TYPE_LABELS[deleting.type] : ""}
              </span>
              的映射。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBusy}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingBusy}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingBusy ? "删除中..." : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}