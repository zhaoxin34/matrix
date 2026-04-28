"use client";

import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

interface AgentPrototypeFormProps {
  initialData?: {
    name: string;
    description: string;
    model: string;
    temperature: number;
    max_tokens: number;
  };
  onSubmit: (data: {
    name: string;
    description: string;
    model: string;
    temperature: number;
    max_tokens: number;
  }) => void;
  onCancel?: () => void;
  loading?: boolean;
}

const COMMON_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "claude-3-5-sonnet",
  "claude-3-opus",
  "gemini-2.0-flash",
];

export default function AgentPrototypeForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: AgentPrototypeFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [model, setModel] = useState(initialData?.model || "gpt-4o");
  const [temperature, setTemperature] = useState(
    initialData?.temperature || 0.7,
  );
  const [maxTokens, setMaxTokens] = useState(initialData?.max_tokens || 4096);

  const handleSubmit = () => {
    onSubmit({
      name,
      description,
      model,
      temperature,
      max_tokens: maxTokens,
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <TextField
        fullWidth
        label="Agent原型名称"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={loading}
        data-testid="inp-prototype-name"
      />

      <TextField
        fullWidth
        label="描述"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={2}
        disabled={loading}
        data-testid="inp-prototype-description"
      />

      <FormControl fullWidth>
        <InputLabel>模型</InputLabel>
        <Select
          value={model}
          label="模型"
          onChange={(e) => setModel(e.target.value)}
          disabled={loading}
          data-testid="select-model"
        >
          {COMMON_MODELS.map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box>
        <Typography gutterBottom>温度 (Temperature): {temperature}</Typography>
        <Slider
          value={temperature}
          onChange={(_, v) => setTemperature(v as number)}
          min={0}
          max={2}
          step={0.1}
          marks={[
            { value: 0, label: "0" },
            { value: 1, label: "1" },
            { value: 2, label: "2" },
          ]}
          disabled={loading}
          data-testid="slider-temperature"
        />
      </Box>

      <Box>
        <Typography gutterBottom>
          最大 Token 数 (Max Tokens): {maxTokens}
        </Typography>
        <Slider
          value={maxTokens}
          onChange={(_, v) => setMaxTokens(v as number)}
          min={100}
          max={32000}
          step={100}
          disabled={loading}
          data-testid="slider-max-tokens"
        />
      </Box>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        {onCancel && (
          <Button onClick={onCancel} disabled={loading}>
            取消
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !name.trim() || !model}
          data-testid="btn-submit-prototype"
        >
          {loading ? "保存中..." : "保存"}
        </Button>
      </Box>
    </Box>
  );
}
