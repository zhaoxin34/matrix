"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import SaveIcon from "@mui/icons-material/Save";
import DOMPurify from "dompurify";

interface PromptsField {
  soul: string;
  memory: string;
  reasoning: string;
  agents: string;
  workflow: string;
  communication: string;
}

interface AgentPrototypePromptsProps {
  prompts: PromptsField;
  onChange: (prompts: PromptsField) => void;
  readOnly?: boolean;
}

const promptTypes = [
  { key: "soul" as const, label: "Soul", desc: "核心灵魂：定义 Agent 的基本性格、价值观和行为准则" },
  { key: "memory" as const, label: "Memory", desc: "记忆机制：定义 Agent 如何存储和检索过往经验" },
  { key: "reasoning" as const, label: "Reasoning", desc: "推理方式：定义 Agent 的思考链和问题解决模式" },
  { key: "agents" as const, label: "Agents", desc: "多智能体：定义多 Agent 协作时的角色分工" },
  { key: "workflow" as const, label: "Workflow", desc: "工作流程：定义任务执行的标准流程和步骤" },
  { key: "communication" as const, label: "Communication", desc: "沟通方式：定义 Agent 与用户/其他 Agent 交互规范" },
];

export default function AgentPrototypePrompts({
  prompts,
  onChange,
  readOnly = false,
}: AgentPrototypePromptsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [localPrompts, setLocalPrompts] = useState(prompts);
  const [saving, setSaving] = useState<string | null>(null);

  const currentType = promptTypes[activeTab];

  const handleValueChange = (key: keyof PromptsField, value: string) => {
    const updated = { ...localPrompts, [key]: value };
    setLocalPrompts(updated);
    if (!readOnly) {
      onChange(updated);
    }
  };

  const handleSave = (key: keyof PromptsField) => {
    setSaving(key);
    setTimeout(() => {
      onChange(localPrompts);
      setSaving(null);
    }, 300);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          {promptTypes.map((type) => (
            <Tab
              key={type.key}
              label={type.label}
              data-testid={`btn-prompt-type-${type.key}`}
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ py: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
          {currentType.desc}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={6}>
            <TextField
              label={`${currentType.label} Content`}
              value={localPrompts[currentType.key]}
              onChange={(e) => handleValueChange(currentType.key, e.target.value)}
              multiline
              rows={20}
              fullWidth
              placeholder={`Enter ${currentType.label.toLowerCase()} prompt...`}
              disabled={readOnly}
              data-testid={`md-editor-${currentType.key}`}
            />
          </Grid>
          <Grid size={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Preview
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                height: "100%",
                minHeight: 400,
                overflow: "auto",
                bgcolor: "grey.50",
              }}
            >
              {localPrompts[currentType.key] ? (
                <Box
                  sx={{
                    "& h1": { fontSize: "1.5rem", fontWeight: 600, mb: 1 },
                    "& h2": { fontSize: "1.25rem", fontWeight: 600, mb: 1, mt: 2 },
                    "& h3": { fontSize: "1.1rem", fontWeight: 600, mb: 1, mt: 1.5 },
                    "& p": { mb: 1.5, lineHeight: 1.7 },
                    "& code": { bgcolor: "grey.100", px: 0.5, borderRadius: 0.5, fontFamily: "monospace" },
                    "& pre": { bgcolor: "grey.900", color: "grey.100", p: 2, borderRadius: 1, overflow: "auto" },
                    "& ul, & ol": { pl: 3, mb: 1.5 },
                    "& li": { mb: 0.5 },
                  }}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(localPrompts[currentType.key]),
                  }}
                />
              ) : (
                <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                  Preview will appear here...
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {!readOnly && (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            onClick={() => handleSave(currentType.key)}
            disabled={saving === currentType.key}
            data-testid={`btn-save-prompt-${currentType.key}`}
          >
            {saving === currentType.key ? "保存中..." : "保存"}
          </Button>
        </Box>
      )}
    </Paper>
  );
}