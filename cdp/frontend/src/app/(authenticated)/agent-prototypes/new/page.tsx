"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { agentPrototypeApi } from "@/lib/agentPrototypeApi";
import { useSnackbar } from "@/hooks/useSnackbar";
import AgentPrototypePrompts from "@/components/agent-prototype/AgentPrototypePrompts";

interface PromptsField {
  soul: string;
  memory: string;
  reasoning: string;
  agents: string;
  workflow: string;
  communication: string;
}

export default function NewAgentPrototypePage() {
  const router = useRouter();
  const snackbar = useSnackbar();
  const snackbarRef = useRef(snackbar);
  snackbarRef.current = snackbar;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("gpt-4");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [prompts, setPrompts] = useState<PromptsField>({
    soul: "",
    memory: "",
    reasoning: "",
    agents: "",
    workflow: "",
    communication: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      snackbarRef.current.warning("请输入名称");
      return;
    }
    if (!model.trim()) {
      snackbarRef.current.warning("请输入模型");
      return;
    }

    setSaving(true);
    try {
      const prototype = await agentPrototypeApi.create({
        name,
        description,
        model,
        temperature,
        max_tokens: maxTokens,
        prompts,
      });
      snackbarRef.current.success("创建成功");
      router.push(`/agent-prototypes/${prototype.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      snackbarRef.current.error(msg || "创建失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          data-testid="btn-cancel"
        >
          返回
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          新建原型
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            data-testid="inp-name"
          />

          <TextField
            label="描述"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
            data-testid="inp-description"
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="模型"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              sx={{ flex: 1 }}
              data-testid="inp-model"
            />
            <TextField
              label="温度"
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
              slotProps={{ htmlInput: { min: 0, max: 2, step: 0.1 } }}
              sx={{ width: 120 }}
              data-testid="inp-temperature"
            />
            <TextField
              label="最大 Tokens"
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
              slotProps={{ htmlInput: { min: 1 } }}
              sx={{ width: 150 }}
              data-testid="inp-max-tokens"
            />
          </Stack>
        </Box>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Prompts 配置
        </Typography>
        <AgentPrototypePrompts prompts={prompts} onChange={setPrompts} />
      </Box>

      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={saving}
          data-testid="btn-submit"
        >
          {saving ? "创建中..." : "创建"}
        </Button>
      </Box>
    </Box>
  );
}