/**
 * Rule Library API client.
 */

import {
  knlgBasePath,
  knlgDelete,
  knlgGet,
  knlgPost,
  knlgPut,
  type Rule,
} from "./_base";

const path = (ws: string, suffix = "") => knlgBasePath(ws, `/rules${suffix}`);

export async function listRules(
  workspaceCode: string,
  params?: {
    page?: number;
    page_size?: number;
    source_kc_id?: number;
    status?: string;
    min_confidence?: number;
    keyword?: string;
  },
): Promise<{
  items: Rule[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) search.append(k, String(v));
    });
  }
  const qs = search.toString();
  return knlgGet(path(workspaceCode, qs ? `?${qs}` : ""));
}

export async function getRule(
  workspaceCode: string,
  id: number,
): Promise<Rule> {
  return knlgGet(path(workspaceCode, `/${id}`));
}

export async function createRule(
  workspaceCode: string,
  data: {
    name: string;
    description?: string;
    source_kc_id: number;
    scope: Record<string, unknown>;
    trigger: {
      type: string;
      event_name: string;
      filter?: unknown[];
      target_entity?: unknown;
    };
    conditions: Array<{
      field: string;
      operator: string;
      value: unknown;
      combinator?: string;
    }>;
    conclusion: Record<string, unknown>;
    exceptions?: Array<Record<string, unknown>>;
    confidence?: number;
  },
): Promise<Rule> {
  return knlgPost(path(workspaceCode), data);
}

export async function updateRule(
  workspaceCode: string,
  id: number,
  data: Partial<{
    name: string;
    description: string;
    trigger: unknown;
    conditions: unknown[];
    conclusion: unknown;
    exceptions: unknown[];
    confidence: number;
  }>,
): Promise<Rule> {
  return knlgPut(path(workspaceCode, `/${id}`), data);
}

export async function deleteRule(
  workspaceCode: string,
  id: number,
): Promise<null> {
  return knlgDelete(path(workspaceCode, `/${id}`));
}

export async function publishRule(
  workspaceCode: string,
  id: number,
): Promise<Rule> {
  return knlgPost(path(workspaceCode, `/${id}/publish`), {});
}

export async function activateRule(
  workspaceCode: string,
  id: number,
): Promise<Rule> {
  return knlgPost(path(workspaceCode, `/${id}/activate`), {});
}

export async function pauseRule(
  workspaceCode: string,
  id: number,
): Promise<Rule> {
  return knlgPost(path(workspaceCode, `/${id}/pause`), {});
}

export async function deprecateRule(
  workspaceCode: string,
  id: number,
): Promise<Rule> {
  return knlgPost(path(workspaceCode, `/${id}/deprecate`), {});
}

export async function listEvidences(
  workspaceCode: string,
  ruleId: number,
  params?: {
    page?: number;
    page_size?: number;
    case_source?: string;
    validator_type?: string;
  },
): Promise<{ items: unknown[]; total: number }> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) search.append(k, String(v));
    });
  }
  const qs = search.toString();
  return knlgGet(
    path(workspaceCode, `/${ruleId}/evidences${qs ? `?${qs}` : ""}`),
  );
}
