"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import AgentPrototypeForm from "@/components/agent-prototype/AgentPrototypeForm";
import { agentPrototypeApi } from "@/lib/agentPrototypeApi";
import type { AgentPrototype, UpdateAgentPrototypeRequest } from "@/lib/agentPrototypeApi";

export default function EditAgentPrototypePage() {
  const router = useRouter();
  const params = useParams();
  const prototypeId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prototype, setPrototype] = useState<AgentPrototype | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const p = await agentPrototypeApi.get(prototypeId);
        setPrototype(p);
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取详情失败");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [prototypeId]);

  const handleSubmit = async (data: UpdateAgentPrototypeRequest) => {
    try {
      await agentPrototypeApi.update(prototypeId, data);
      router.push(`/agent-prototypes/${prototypeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
      throw err;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>编辑原型</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {prototype && (
        <AgentPrototypeForm
          mode="edit"
          initialData={prototype}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/agent-prototypes/${prototypeId}`)}
        />
      )}
    </Box>
  );
}
