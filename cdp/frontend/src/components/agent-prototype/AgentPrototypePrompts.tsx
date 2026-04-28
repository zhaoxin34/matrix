"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import MarkdownEditor from "./MarkdownEditor";
import type { PromptsField } from "@/lib/agentPrototypeApi";

const PROMPT_TYPES = [
  { key: "soul", label: "Soul", desc: "核心灵魂：定义 Agent 的基本性格、价值观和行为准则" },
  { key: "memory", label: "Memory", desc: "记忆机制：定义 Agent 如何存储和检索过往经验" },
  { key: "reasoning", label: "Reasoning", desc: "推理方式：定义 Agent 的思考链和问题解决模式" },
  { key: "agents", label: "Agents", desc: "多智能体：定义多 Agent 协作时的角色分工" },
  { key: "workflow", label: "Workflow", desc: "工作流程：定义任务执行的标准流程和步骤" },
  { key: "communication", label: "Comm", desc: "沟通方式：定义 Agent 与用户/其他 Agent 交互规范" },
];

interface AgentPrototypePromptsProps {
  prompts: PromptsField;
  onSave: (type: string, content: string) => void;
  readOnly?: boolean;
}

export default function AgentPrototypePrompts({ prompts, onSave, readOnly = false }: AgentPrototypePromptsProps) {
  const [activeType, setActiveType] = useState("soul");
  const [content, setContent] = useState("");

  const handleTypeChange = (type: string) => {
    setActiveType(type);
    setContent(prompts[type as keyof PromptsField] || "");
  };

  const handleSave = () => {
    onSave(activeType, content);
  };

  return (
    <Box>
      {/* Type selector */}
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        {PROMPT_TYPES.map((type) => (
          <Button
            key={type.key}
            variant={activeType === type.key ? "contained" : "outlined"}
            size="small"
            onClick={() => handleTypeChange(type.key)}
            data-testid={`btn-prompt-type-${type.key}`}
          >
            {type.label}
          </Button>
        ))}
      </Box>

      {/* Description */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {PROMPT_TYPES.find((t) => t.key === activeType)?.desc}
      </Typography>

      {/* Editor */}
      {readOnly ? (
        <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1, minHeight: 200 }}>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap", m: 0 }}>
            {content || "*未填写*"}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ minHeight: 300 }}>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            onSave={handleSave}
            dataTestid={`md-editor-${activeType}`}
          />
        </Box>
      )}
    </Box>
  );
}
