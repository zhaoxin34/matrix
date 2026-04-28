"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AgentPrototypePrompts from "@/components/agent-prototype/AgentPrototypePrompts";
import AgentPrototypeVersions from "@/components/agent-prototype/AgentPrototypeVersions";
import PublishDialog from "@/components/agent-prototype/PublishDialog";
import { agentPrototypeApi, AgentPrototype } from "@/lib/agentPrototypeApi";
import { useSnackbar } from "@/hooks/useSnackbar";
import { ConfirmDialog } from "@/components/ConfirmDialog";

function TabPanel({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
      {value === index && children}
    </Box>
  );
}

export default function AgentPrototypeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prototypeId = params.id as string;
  const snackbar = useSnackbar();

  const [prototype, setPrototype] = useState<AgentPrototype | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchPrototype = useCallback(async () => {
    setLoading(true);
    try {
      const data = await agentPrototypeApi.get(prototypeId);
      setPrototype(data);
    } catch (e) {
      console.error("Failed to fetch prototype:", e);
      snackbar.error("加载失败");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prototypeId]);

  useEffect(() => {
    fetchPrototype();
  }, [fetchPrototype]);

  const handlePublish = async (changeSummary: string) => {
    setPublishLoading(true);
    try {
      await agentPrototypeApi.publish(prototypeId, {
        change_summary: changeSummary || undefined,
      });
      snackbar.success("发布成功");
      setPublishDialogOpen(false);
      fetchPrototype();
    } catch (e) {
      console.error("Failed to publish:", e);
      snackbar.error("发布失败");
    } finally {
      setPublishLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await agentPrototypeApi.delete(prototypeId);
      snackbar.success("删除成功");
      router.push("/agent-prototypes");
    } catch (e) {
      console.error("Failed to delete:", e);
      snackbar.error("删除失败");
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "草稿";
      case "published":
        return "已发布";
      case "archived":
        return "已归档";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!prototype) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography>原型不存在</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/agent-prototypes")}
          data-testid="btn-back"
        >
          返回
        </Button>
        <Typography variant="h5" sx={{ flex: 1 }}>
          {prototype.name}
        </Typography>
        <Chip label={getStatusLabel(prototype.status)} size="small" />
        {(prototype.status === "draft" || prototype.status === "archived") && (
          <Button
            variant="contained"
            onClick={() => setPublishDialogOpen(true)}
            data-testid="btn-publish"
          >
            发布
          </Button>
        )}
        {prototype.status === "draft" && (
          <>
            <Button
              startIcon={<EditIcon />}
              onClick={() =>
                router.push(`/agent-prototypes/${prototypeId}/edit`)
              }
              data-testid="btn-edit"
            >
              编辑
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              data-testid="btn-delete"
            >
              删除
            </Button>
          </>
        )}
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                版本
              </Typography>
              <Typography>v{prototype.version}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                模型
              </Typography>
              <Typography>{prototype.model}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                温度
              </Typography>
              <Typography>{prototype.temperature}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                最大 Token
              </Typography>
              <Typography>{prototype.max_tokens}</Typography>
            </Box>
            <Box sx={{ gridColumn: "span 2" }}>
              <Typography variant="body2" color="text.secondary">
                描述
              </Typography>
              <Typography>{prototype.description || "-"}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="基本信息" />
            <Tab label="Prompts" />
            <Tab label="版本历史" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Typography color="text.secondary">基本信息见上方卡片</Typography>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <AgentPrototypePrompts prototypeId={prototypeId} />
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <AgentPrototypeVersions
              prototypeId={prototypeId}
              currentVersion={prototype.version}
            />
          </TabPanel>
        </CardContent>
      </Card>

      <PublishDialog
        open={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        onConfirm={handlePublish}
        loading={publishLoading}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="确认删除"
        message={`确定要删除原型 "${prototype.name}" 吗？此操作不可恢复。`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        confirmText="删除"
      />
    </Box>
  );
}
