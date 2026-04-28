"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AgentPrototypeForm from "@/components/agent-prototype/AgentPrototypeForm";
import { agentPrototypeApi } from "@/lib/agentPrototypeApi";
import { useSnackbar } from "@/hooks/useSnackbar";

export default function NewAgentPrototypePage() {
  const router = useRouter();
  const snackbar = useSnackbar();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    description: string;
    model: string;
    temperature: number;
    max_tokens: number;
  }) => {
    setLoading(true);
    try {
      const prototype = await agentPrototypeApi.create({
        name: data.name,
        description: data.description || undefined,
        model: data.model,
        temperature: data.temperature,
        max_tokens: data.max_tokens,
      });
      snackbar.success("创建成功");
      router.push(`/agent-prototypes/${prototype.id}`);
    } catch (e) {
      console.error("Failed to create prototype:", e);
      snackbar.error("创建失败");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/agent-prototypes");
  };

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
        <Typography variant="h5">新建Agent原型</Typography>
      </Box>

      <Card>
        <CardContent>
          <AgentPrototypeForm
            onSubmit={handleSubmit}
            onCancel={handleBack}
            loading={loading}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
