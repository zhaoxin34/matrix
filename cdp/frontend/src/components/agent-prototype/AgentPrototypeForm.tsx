"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import type {
  AgentPrototype,
  CreateAgentPrototypeRequest,
  UpdateAgentPrototypeRequest,
  PromptsField,
} from "@/lib/agentPrototypeApi";
import AgentPrototypePrompts from "./AgentPrototypePrompts";

interface AgentPrototypeFormProps {
  mode: "create" | "edit";
  initialData?: AgentPrototype;
  onSubmit: (data: CreateAgentPrototypeRequest | UpdateAgentPrototypeRequest) => Promise<void>;
  onCancel?: () => void;
}

const defaultPrompts: PromptsField = {
  soul: "",
  memory: "",
  reasoning: "",
  agents: "",
  workflow: "",
  communication: "",
};

export default function AgentPrototypeForm({ mode, initialData, onSubmit, onCancel }: AgentPrototypeFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [model, setModel] = useState(initialData?.model || "gpt-4");
  const [temperature, setTemperature] = useState(initialData?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(initialData?.max_tokens || 4096);
  const [prompts, setPrompts] = useState<PromptsField>(initialData?.prompts || defaultPrompts);

  const handlePromptSave = (type: string, content: string) => {
    setPrompts((prev) => ({ ...prev, [type]: content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = mode === "create"
        ? { name, description, model, temperature, max_tokens: maxTokens, prompts }
        : { name, description, model, temperature, max_tokens: maxTokens, prompts };
      await onSubmit(data as CreateAgentPrototypeRequest | UpdateAgentPrototypeRequest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
          data-testid="inp-name"
        />
      </Box>

      <TextField
        label="描述"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={2}
        fullWidth
        data-testid="inp-description"
      />

      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="模型"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
          fullWidth
          data-testid="inp-model"
        />
        <TextField
          label="温度"
          type="number"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
          slotProps={{ htmlInput: { min: 0, max: 2, step: 0.1 } }}
          data-testid="inp-temperature"
          sx={{ width: 120 }}
        />
        <TextField
          label="最大 Tokens"
          type="number"
          value={maxTokens}
          onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)}
          slotProps={{ htmlInput: { min: 1 } }}
          data-testid="inp-max-tokens"
          sx={{ width: 150 }}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Prompts 配置
        </Typography>
        <AgentPrototypePrompts prompts={prompts} onSave={handlePromptSave} />
      </Box>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        {onCancel && (
          <Button type="button" onClick={onCancel} data-testid="btn-cancel" disabled={loading}>
            取消
          </Button>
        )}
        <Button type="submit" variant="contained" data-testid="btn-submit" disabled={loading}>
          {mode === "create" ? "创建" : "保存"}
        </Button>
      </Box>
    </Box>
  );
}
