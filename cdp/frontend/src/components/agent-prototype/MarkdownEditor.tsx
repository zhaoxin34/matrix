"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  placeholder?: string;
  dataTestid: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  onSave,
  placeholder = "输入 Markdown 内容...",
  dataTestid,
}: MarkdownEditorProps) {
  const [preview, setPreview] = useState("");

  const handlePreview = () => {
    setPreview(value);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
      <Box sx={{ display: "flex", gap: 2, flex: 1, minHeight: 300 }}>
        {/* Editor */}
        <TextField
          multiline
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          data-testid={dataTestid}
          slotProps={{
            input: {
              sx: { fontFamily: "monospace", fontSize: "0.875rem" },
            },
          }}
          sx={{ flex: 1 }}
        />

        {/* Preview */}
        <Box
          sx={{
            flex: 1,
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            p: 2,
            overflow: "auto",
            bgcolor: "#fafafa",
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            预览
          </Typography>
          <Box
            sx={{ "& h1": { fontSize: "1.5rem", fontWeight: 600 }, "& h2": { fontSize: "1.25rem", fontWeight: 600 } }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview || "*预览区域*"}</ReactMarkdown>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <Button variant="outlined" size="small" onClick={handlePreview} data-testid={`${dataTestid}-preview`}>
          刷新预览
        </Button>
        <Button variant="contained" size="small" onClick={onSave} data-testid={`${dataTestid}-save`}>
          保存
        </Button>
      </Box>
    </Box>
  );
}
