"use client";

import { knlgGet, knlgPost } from "@/lib/api/knlg-base/_base";

export interface AiSession {
  id: number;
  expert_id: number;
  topic: string;
  mode: string;
  status: string;
  tree_id: number | null;
  current_turn_index: number;
  max_turns: number;
  last_event_id: string | null;
  summary: string | null;
  started_at: string | null;
  ended_at: string | null;
  workspace_id: number;
  created_by: number;
  created_at: string;
}

export async function listAiSessions(
  workspaceCode: string,
  opts: { page?: number; page_size?: number; status?: string } = {},
): Promise<{ items: AiSession[]; total: number }> {
  const params = new URLSearchParams();
  if (opts.page) params.set("page", String(opts.page));
  if (opts.page_size) params.set("page_size", String(opts.page_size));
  if (opts.status) params.set("status", opts.status);
  const qs = params.toString();
  return knlgGet(
    `/api/v1/workspaces/${workspaceCode}/knlg-base/interview/ai/sessions${qs ? `?${qs}` : ""}`,
  );
}

export async function getAiSession(
  workspaceCode: string,
  sessionId: number,
): Promise<AiSession> {
  return knlgGet(
    `/api/v1/workspaces/${workspaceCode}/knlg-base/interview/ai/sessions/${sessionId}`,
  );
}

export async function createAiSession(
  workspaceCode: string,
  data: { topic: string; tree_id?: number; max_turns?: number },
): Promise<AiSession> {
  return knlgPost(
    `/api/v1/workspaces/${workspaceCode}/knlg-base/interview/ai/sessions`,
    data,
  );
}

export async function pauseAiSession(
  workspaceCode: string,
  sessionId: number,
): Promise<AiSession> {
  return knlgPost(
    `/api/v1/workspaces/${workspaceCode}/knlg-base/interview/ai/sessions/${sessionId}/pause`,
  );
}

export async function abandonAiSession(
  workspaceCode: string,
  sessionId: number,
): Promise<AiSession> {
  return knlgPost(
    `/api/v1/workspaces/${workspaceCode}/knlg-base/interview/ai/sessions/${sessionId}/abandon`,
  );
}

/**
 * Open SSE stream for an AI interview turn. Returns EventSource.
 * Phase 3 MVP: client closes EventSource after `done` event.
 */
export type SseEventData = Record<string, unknown>;

export function openAiStream(
  workspaceCode: string,
  sessionId: number,
  onEvent: (event: string, data: SseEventData) => void,
  lastEventId?: string,
): EventSource {
  const url = `/api/v1/workspaces/${workspaceCode}/knlg-base/interview/ai/sessions/${sessionId}/stream`;
  const es = new EventSource(url, { withCredentials: true });
  // Note: EventSource doesn't support custom headers, so Last-Event-ID is omitted in MVP.
  // For resume, we use fetch+ReadableStream instead.
  void lastEventId;
  es.addEventListener("message", (e: MessageEvent) => {
    try {
      onEvent("message", JSON.parse(e.data));
    } catch {
      /* ignore */
    }
  });
  [
    "connected",
    "turn_received",
    "message_start",
    "content_delta",
    "signal_detected",
    "question_proposed",
    "message_end",
    "turn_completed",
    "session_state_changed",
    "summary_ready",
    "done",
    "error",
  ].forEach((evt) => {
    es.addEventListener(evt, (e: MessageEvent) => {
      try {
        onEvent(evt, JSON.parse(e.data || "{}"));
      } catch {
        onEvent(evt, {});
      }
    });
  });
  return es;
}
