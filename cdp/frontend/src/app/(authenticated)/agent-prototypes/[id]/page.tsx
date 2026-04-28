"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import type { AgentPrototype, VersionResponse } from "@/lib/agentPrototypeApi";
import { agentPrototypeApi } from "@/lib/agentPrototypeApi";
import AgentPrototypePrompts from "@/components/agent-prototype/AgentPrototypePrompts";
import AgentPrototypeVersions from "@/components/agent-prototype/AgentPrototypeVersions";
import PublishDialog from "@/components/agent-prototype/PublishDialog";
import ConfirmDialog from "@/components/agent-prototype/ConfirmDialog";

const STATUS_COLORS: Record<string, "default" | "success" | "warning"> = {
  draft: "default",
  enabled: "success",
  disabled: "warning",
};

export default function AgentPrototypeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prototypeId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prototype, setPrototype] = useState<AgentPrototype | null>(null);
  const [versions, setVersions] = useState<VersionResponse[]>([]);
  const [tab, setTab] = useState(0);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, v] = await Promise.all([
        agentPrototypeApi.get(prototypeId),
        agentPrototypeApi.listVersions(prototypeId),
      ]);
      setPrototype(p);
      setVersions(v);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取详情失败");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [prototypeId]);

  const handlePublish = async (changeSummary: string) => {
    setPublishLoading(true);
    try {
      await agentPrototypeApi.publish(prototypeId, { change_summary: changeSummary });
      setPublishOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setPublishLoading(false);
    }
  };

  const handleRollback = async (version: string) => {
    try {
      await agentPrototypeApi.rollback(prototypeId, { version });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "回滚失败");
    }
  };

  const handleToggleStatus = async () => {
    if (!prototype) return;
    setToggleLoading(true);
    try {
      const updated = await agentPrototypeApi.toggleStatus(prototypeId);
      setPrototype(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "状态切换失败");
    } finally {
      setToggleLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await agentPrototypeApi.delete(prototypeId);
      router.push("/agent-prototypes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!prototype) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "原型不存在"}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5">{prototype.name}</Typography>
          <Chip
            label={prototype.status === "draft" ? "草稿" : prototype.status === "enabled" ? "已启用" : "已禁用"}
            color={STATUS_COLORS[prototype.status]}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {prototype.status === "draft" && (
            <>
              <Button variant="outlined" onClick={() => router.push(`/agent-prototypes/${prototypeId}/edit`)} data-testid="btn-edit">
                编辑
              </Button>
              <Button variant="contained" onClick={() => setPublishOpen(true)} data-testid="btn-publish">
                发布
              </Button>
              <Button color="error" onClick={() => setDeleteOpen(true)} data-testid="btn-delete">
                删除
              </Button>
            </>
          )}
          {prototype.status !== "draft" && (
            <Button
              variant="outlined"
              onClick={handleToggleStatus}
              data-testid="btn-toggle-status"
              disabled={toggleLoading}
            >
              {prototype.status === "enabled" ? "禁用" : "启用"}
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="基本信息" />
        <Tab label="Prompts" />
        <Tab label="版本历史" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 600 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">描述</Typography>
            <Typography variant="body2">{prototype.description || "-"}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">模型</Typography>
            <Typography variant="body2" component="span" sx={{ fontFamily: "monospace" }}>{prototype.model}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">版本</Typography>
            <Typography variant="body2" component="span" sx={{ fontFamily: "monospace" }}>{prototype.version}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">温度</Typography>
            <Typography variant="body2">{prototype.temperature}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">最大 Tokens</Typography>
            <Typography variant="body2">{prototype.max_tokens}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">创建时间</Typography>
            <Typography variant="body2">{new Date(prototype.created_at).toLocaleString()}</Typography>
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <AgentPrototypePrompts
          prompts={prototype.prompts}
          onSave={() => {}}
          readOnly
        />
      )}

      {tab === 2 && (
        <AgentPrototypeVersions
          versions={versions}
          currentVersion={prototype.version}
          onRollback={handleRollback}
        />
      )}

      <PublishDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onPublish={handlePublish}
        loading={publishLoading}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="确认删除"
        message="确定要删除这个原型吗？删除后将无法恢复。"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        dataTestid="dlg-delete"
      />
    </Box>
  );
}
