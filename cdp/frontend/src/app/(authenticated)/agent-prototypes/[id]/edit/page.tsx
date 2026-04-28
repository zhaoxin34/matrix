"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AgentPrototypeForm from "@/components/agent-prototype/AgentPrototypeForm";
import { agentPrototypeApi, AgentPrototype } from "@/lib/agentPrototypeApi";
import { useSnackbar } from "@/hooks/useSnackbar";

export default function EditAgentPrototypePage() {
  const router = useRouter();
  const params = useParams();
  const prototypeId = params.id as string;
  const snackbar = useSnackbar();

  const [prototype, setPrototype] = useState<AgentPrototype | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPrototype = async () => {
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
    };
    fetchPrototype();
  }, [prototypeId, snackbar]);

  const handleSubmit = async (data: {
    name: string;
    description: string;
    model: string;
    temperature: number;
    max_tokens: number;
  }) => {
    setSubmitting(true);
    try {
      await agentPrototypeApi.update(prototypeId, {
        name: data.name,
        description: data.description || undefined,
        model: data.model,
        temperature: data.temperature,
        max_tokens: data.max_tokens,
      });
      snackbar.success("更新成功");
      router.push(`/agent-prototypes/${prototypeId}`);
    } catch (e) {
      console.error("Failed to update prototype:", e);
      snackbar.error("更新失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push(`/agent-prototypes/${prototypeId}`);
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
          onClick={handleBack}
          data-testid="btn-back"
        >
          返回
        </Button>
        <Typography variant="h5">编辑原型</Typography>
      </Box>

      <Card>
        <CardContent>
          <AgentPrototypeForm
            initialData={{
              name: prototype.name,
              description: prototype.description || "",
              model: prototype.model,
              temperature: prototype.temperature,
              max_tokens: prototype.max_tokens,
            }}
            onSubmit={handleSubmit}
            onCancel={handleBack}
            loading={submitting}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
