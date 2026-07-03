"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { openAiStream, type SseEventData } from "@/lib/api/knlg-base/ai";
import { useSignalStore } from "@/lib/stores/signal-store";

interface UseInterviewStreamOpts {
  workspaceCode: string;
  sessionId: number;
  enabled?: boolean;
}

interface ChatMessage {
  id: string;
  role: "ai" | "expert" | "system";
  content: string;
  streaming?: boolean;
  turnIndex?: number;
  signals?: { type: string; confidence: number; text: string }[];
  followupReason?: string;
  rationale?: string;
}

/**
 * Hook for managing an AI interview SSE stream.
 * Returns chat messages + handlers for submitting expert answers.
 */
export function useInterviewStream({
  workspaceCode,
  sessionId,
  enabled = true,
}: UseInterviewStreamOpts) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [running, setRunning] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const addSignal = useSignalStore((s) => s.addSignal);

  const close = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  const handleEvent = useCallback(
    (event: string, data: SseEventData) => {
      switch (event) {
        case "connected":
          break;
        case "turn_received":
          setMessages((prev) => [
            ...prev,
            {
              id: `t-${Date.now()}-recv`,
              role: "system",
              content: "已收到回答",
            },
          ]);
          setThinking(true);
          break;
        case "signal_detected": {
          const sig = {
            type: String(data.type ?? "pain_point"),
            confidence: Number(data.confidence ?? 0),
            text: String(data.text ?? ""),
            linkedQuestionId: (data.linkedQuestionId as number | null) ?? null,
          };
          setMessages((prev) =>
            prev.map((m) => {
              if (m.role !== "expert") return m;
              if (m.turnIndex !== Number(data.turnIndex)) return m;
              return { ...m, signals: [...(m.signals ?? []), sig] };
            }),
          );
          addSignal(Number(data.turnIndex), sig);
          break;
        }
        case "question_proposed": {
          setThinking(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `q-${Date.now()}`,
              role: "ai" as const,
              content: String(data.question ?? ""),
              turnIndex: Number(data.turnIndex ?? 0),
              followupReason:
                data.reason != null ? String(data.reason) : undefined,
              rationale:
                data.rationale != null ? String(data.rationale) : undefined,
            },
          ]);
          break;
        }
        case "summary_ready":
          setMessages((prev) => [
            ...prev,
            {
              id: `s-${Date.now()}`,
              role: "ai" as const,
              content:
                data.summary != null ? String(data.summary) : "(summary)",
            },
          ]);
          setDone(true);
          break;
        case "done":
          setDone(true);
          setThinking(false);
          close();
          break;
        case "error":
          setError(data.message != null ? String(data.message) : "Error");
          setThinking(false);
          close();
          break;
      }
    },
    [addSignal, close],
  );

  const submitAnswer = useCallback(
    (answer: string) => {
      if (!enabled || running) return;
      setRunning(true);
      setError(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "expert",
          content: answer,
          turnIndex: prev.filter((m) => m.role === "expert").length,
        },
      ]);
      close();
      esRef.current = openAiStream(workspaceCode, sessionId, handleEvent);
      setRunning(false);
    },
    [enabled, running, close, workspaceCode, sessionId, handleEvent],
  );

  useEffect(() => {
    return () => close();
  }, [close]);

  return { messages, running, thinking, done, error, submitAnswer };
}
