"use client";

/**
 * Phase 3 — Prompt management API client (knlg-base-p3-llm-interview §8.2).
 *
 * Backed by `knlg_llm_prompt` table on the backend. Endpoints in this file
 * are wired to the prompt-management API per spec/prompt-management/spec.md
 * §"Prompt 版本控制" + §"试运行渲染"; the backend endpoints are added by
 * the parallel §5 implementation tasks. Until those land, callers can use
 * the type signatures to write UI code that compiles but the requests will
 * 404 — fail fast, fail loudly is the design intent.
 */

import { knlgGet, knlgPost, knlgPut } from "@/lib/api/knlg-base/_base";

export interface KnlgPrompt {
  id: number;
  workspace_id: number;
  key: string;
  version: string;
  status: "active" | "deprecated" | "draft";
  template: string;
  variables: Array<{
    key: string;
    type: string;
    default?: unknown;
    description?: string;
  }>;
  traffic_split: Record<string, number> | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface RenderRequest {
  prompt_id: number;
  variables: Record<string, unknown>;
}

export interface RenderResult {
  prompt_id: number;
  version: string;
  rendered: string;
  cached: boolean;
  snapshot_id: number | null;
}

export async function listPrompts(params?: {
  status?: KnlgPrompt["status"] | string;
  key?: string;
  page?: number;
  page_size?: number;
}): Promise<KnlgPrompt[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", String(params.status));
  if (params?.key) qs.set("key", params.key);
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.page_size != null) qs.set("page_size", String(params.page_size));
  const path = `/api/v1/workspaces/{code}/knlg-base/prompts${qs.toString() ? `?${qs}` : ""}`;
  return knlgGet<KnlgPrompt[]>(path);
}

export async function getPrompt(params: {
  workspaceCode: string;
  promptId: number;
}): Promise<KnlgPrompt> {
  return knlgGet<KnlgPrompt>(
    params.workspaceCode
      ? `/api/v1/workspaces/${params.workspaceCode}/knlg-base/prompts/${params.promptId}`
      : `/api/v1/workspaces/{code}/knlg-base/prompts/${params.promptId}`,
  );
}

export async function createPromptDraft(payload: {
  key: string;
  template: string;
  variables: KnlgPrompt["variables"];
}): Promise<KnlgPrompt> {
  return knlgPost<KnlgPrompt>(
    `/api/v1/workspaces/{code}/knlg-base/prompts`,
    payload,
  );
}

export async function updatePrompt(
  promptId: number,
  payload: Pick<KnlgPrompt, "template" | "variables">,
): Promise<KnlgPrompt> {
  return knlgPut<KnlgPrompt>(
    `/api/v1/workspaces/{code}/knlg-base/prompts/${promptId}`,
    payload,
  );
}

/**
 * Render a prompt server-side (Redis cache hit/miss).
 * Used by the "试运行" button in the editor and by the LLM Gateway itself.
 */
export async function renderPrompt(params: {
  workspaceCode: string;
  req: RenderRequest;
}): Promise<RenderResult> {
  return knlgPost<RenderResult>(
    params.workspaceCode
      ? `/api/v1/workspaces/${params.workspaceCode}/knlg-base/prompts/render`
      : `/api/v1/workspaces/{code}/knlg-base/prompts/render`,
    params.req,
  );
}
