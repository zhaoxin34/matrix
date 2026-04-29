"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PublishIcon from "@mui/icons-material/Publish";
import BlockIcon from "@mui/icons-material/Block";
import HistoryIcon from "@mui/icons-material/History";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { agentPrototypeApi, AgentPrototype, AgentPrototypeStatus } from "@/lib/agentPrototypeApi";
import { useSnackbar } from "@/hooks/useSnackbar";
import AgentPrototypePrompts from "@/components/agent-prototype/AgentPrototypePrompts";
import PublishDialog from "@/components/agent-prototype/PublishDialog";
import HistoryDialog from "@/components/agent-prototype/HistoryDialog";

const statusLabels: Record<AgentPrototypeStatus, string> = {
  draft: "草稿",
  enabled: "已启用",
  disabled: "已禁用",
};

const statusColors: Record<AgentPrototypeStatus, "default" | "success" | "warning"> = {
  draft: "default",
  enabled: "success",
  disabled: "warning",
};

export default function AgentPrototypeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const snackbar = useSnackbar();
  const prototypeId = parseInt(params.id as string);

  const [prototype, setPrototype] = useState<AgentPrototype | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const loadPrototype = useCallback(async () => {
    setLoading(true);
    try {
      const data = await agentPrototypeApi.get(prototypeId);
      setPrototype(data);
    } catch {
      snackbar.error("加载失败");
      router.push("/agent-prototypes");
    } finally {
      setLoading(false);
    }
  }, [prototypeId, router, snackbar]);

  useEffect(() => {
    loadPrototype();
  }, [loadPrototype]);

  const handlePublish = async (version: string, changeSummary: string) => {
    try {
      const updated = await agentPrototypeApi.publish(prototypeId, {
        version,
        change_summary: changeSummary,
      });
      setPrototype(updated);
      setPublishDialogOpen(false);
      snackbar.success("发布成功");
      loadPrototype();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      snackbar.error(msg || "发布失败");
    }
  };

  const handleToggleStatus = async () => {
    if (!prototype) return;
    try {
      const updated = await agentPrototypeApi.toggleStatus(prototypeId);
      setPrototype(updated);
      snackbar.success(updated.status === "enabled" ? "已启用" : "已禁用");
      loadPrototype();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      snackbar.error(msg || "操作失败");
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这个原型吗？")) return;
    try {
      await agentPrototypeApi.delete(prototypeId);
      snackbar.success("删除成功");
      router.push("/agent-prototypes");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      snackbar.error(msg || "删除失败");
    }
  };

  if (loading || !prototype) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/agent-prototypes")}
        >
          返回
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {prototype.name}
        </Typography>
        <Chip
          label={statusLabels[prototype.status]}
          color={statusColors[prototype.status]}
          size="small"
        />
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        {prototype.status === "draft" && (
          <>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => router.push(`/agent-prototypes/${prototypeId}/edit`)}
              data-testid="btn-edit"
            >
              编辑
            </Button>
            <Button
              variant="contained"
              startIcon={<PublishIcon />}
              onClick={() => setPublishDialogOpen(true)}
              data-testid="btn-publish"
            >
              发布
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              data-testid="btn-delete"
            >
              删除
            </Button>
          </>
        )}
        {prototype.status !== "draft" && (
          <Button
            variant="outlined"
            startIcon={<BlockIcon />}
            onClick={handleToggleStatus}
            data-testid="btn-toggle-status"
          >
            {prototype.status === "enabled" ? "禁用" : "启用"}
          </Button>
        )}
        <Button
          variant="text"
          startIcon={<HistoryIcon />}
          onClick={() => setHistoryDialogOpen(true)}
        >
          版本历史
        </Button>
      </Stack>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="基本信息" />
          <Tab label="Prompts" />
          <Tab label="版本历史" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 4 }}>
                <Typography variant="subtitle2" sx={{ width: 120, color: "text.secondary" }}>
                  描述
                </Typography>
                <Typography>{prototype.description || "-"}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", gap: 4 }}>
                <Typography variant="subtitle2" sx={{ width: 120, color: "text.secondary" }}>
                  版本
                </Typography>
                <Typography>{prototype.version}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", gap: 4 }}>
                <Typography variant="subtitle2" sx={{ width: 120, color: "text.secondary" }}>
                  模型
                </Typography>
                <Typography>{prototype.model}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", gap: 4 }}>
                <Typography variant="subtitle2" sx={{ width: 120, color: "text.secondary" }}>
                  温度
                </Typography>
                <Typography>{prototype.temperature}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", gap: 4 }}>
                <Typography variant="subtitle2" sx={{ width: 120, color: "text.secondary" }}>
                  最大 Tokens
                </Typography>
                <Typography>{prototype.max_tokens}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", gap: 4 }}>
                <Typography variant="subtitle2" sx={{ width: 120, color: "text.secondary" }}>
                  创建时间
                </Typography>
                <Typography>
                  {new Date(prototype.created_at).toLocaleString("zh-CN")}
                </Typography>
              </Box>
            </Box>
          )}

          {tab === 1 && (
            <AgentPrototypePrompts
              prompts={prototype.prompts}
              onChange={() => {}}
              readOnly={true}
            />
          )}

          {tab === 2 && (
            <Box>
              <Typography color="text.secondary">
                版本: {prototype.version}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <PublishDialog
        open={publishDialogOpen}
        prototype={prototype}
        onClose={() => setPublishDialogOpen(false)}
        onPublish={handlePublish}
      />

      <HistoryDialog
        open={historyDialogOpen}
        prototype={prototype}
        onClose={() => setHistoryDialogOpen(false)}
        onRollback={async (version) => {
          const updated = await agentPrototypeApi.rollback(prototypeId, { version });
          return updated;
        }}
        onRollbackSuccess={async () => {
          loadPrototype();
          snackbar.success("回滚成功");
        }}
      />
    </Box>
  );
}