"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import AgentPrototypeForm from "@/components/agent-prototype/AgentPrototypeForm";
import { agentPrototypeApi } from "@/lib/agentPrototypeApi";
import type { CreateAgentPrototypeRequest, UpdateAgentPrototypeRequest } from "@/lib/agentPrototypeApi";

export default function NewAgentPrototypePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateAgentPrototypeRequest | UpdateAgentPrototypeRequest) => {
    try {
      const prototype = await agentPrototypeApi.create(data as CreateAgentPrototypeRequest);
      router.push(`/agent-prototypes/${prototype.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
      throw err;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>新建原型</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <AgentPrototypeForm
        mode="create"
        onSubmit={handleSubmit}
      />
    </Box>
  );
}
