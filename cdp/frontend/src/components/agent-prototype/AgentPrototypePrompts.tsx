"use client";

import { useState, useEffect, useCallback } from "react";
import { Box, Tabs, Tab, Button, Alert, CircularProgress } from "@mui/material";
import {
  agentPrototypePromptApi,
  AgentPrototypePrompt,
  AgentPrototypePromptCreate,
  AgentPrototypePromptUpdate,
} from "@/lib/agentPrototypeApi";
import MarkdownEditor from "./MarkdownEditor";
import { useSnackbar } from "@/hooks/useSnackbar";

const PROMPT_TYPES = [
  { value: "soul", label: "Soul" },
  { value: "memory", label: "Memory" },
  { value: "reasoning", label: "Reasoning" },
  { value: "agents", label: "Agents" },
  { value: "workflow", label: "Workflow" },
  { value: "communication", label: "Communication" },
];

interface AgentPrototypePromptsProps {
  prototypeId: string;
}

export default function AgentPrototypePrompts({
  prototypeId,
}: AgentPrototypePromptsProps) {
  const [selectedType, setSelectedType] = useState("soul");
  const [prompts, setPrompts] = useState<Map<string, AgentPrototypePrompt>>(
    new Map(),
  );
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const snackbar = useSnackbar();

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await agentPrototypePromptApi.list(prototypeId);
      const promptMap = new Map<string, AgentPrototypePrompt>();
      data.forEach((p) => promptMap.set(p.type, p));
      setPrompts(promptMap);
      if (promptMap.has(selectedType)) {
        setContent(promptMap.get(selectedType)!.content);
      } else {
        setContent("");
      }
    } catch (e) {
      console.error("Failed to fetch prompts:", e);
    } finally {
      setLoading(false);
    }
  }, [prototypeId, selectedType]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    if (prompts.has(type)) {
      setContent(prompts.get(type)!.content);
    } else {
      setContent("");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const existing = prompts.get(selectedType);
      if (existing) {
        const data: AgentPrototypePromptUpdate = { content };
        await agentPrototypePromptApi.update(existing.id, data);
        snackbar.success("保存成功");
      } else {
        const data: AgentPrototypePromptCreate = {
          prototype_id: prototypeId,
          type: selectedType,
          content,
        };
        await agentPrototypePromptApi.create(data);
        snackbar.success("创建成功");
      }
      fetchPrompts();
    } catch (e) {
      console.error("Failed to save prompt:", e);
      snackbar.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const currentPrompt = prompts.get(selectedType);

  return (
    <Box>
      <Tabs
        value={selectedType}
        onChange={(_, v) => handleTypeChange(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {PROMPT_TYPES.map((t) => (
          <Tab key={t.value} value={t.value} label={t.label} />
        ))}
      </Tabs>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {currentPrompt ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              当前版本: v{currentPrompt.version}
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              尚未创建{" "}
              {PROMPT_TYPES.find((t) => t.value === selectedType)?.label} 的内容
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <MarkdownEditor value={content} onChange={setContent} />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !content.trim()}
              data-testid="btn-save-prompt"
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
