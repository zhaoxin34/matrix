"use client";

import { Box } from "@mui/material";
import dynamic from "next/dynamic";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false },
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  minHeight = 300,
}: MarkdownEditorProps) {
  return (
    <Box
      data-color-mode="light"
      sx={{
        "& .w-md-editor": {
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        },
        "& .w-md-editor-text-input": {
          minHeight,
        },
      }}
    >
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        preview="live"
        height={minHeight}
      />
    </Box>
  );
}
