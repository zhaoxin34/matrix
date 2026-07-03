/**
 * Knowledge Import API client.
 */

import {
  knlgBasePath,
  knlgDelete,
  knlgGet,
  knlgPatch,
  knlgPost,
  knlgUpload,
  type Document,
  type ImportJob,
} from "./_base";

const path = (ws: string, suffix = "") => knlgBasePath(ws, `/import${suffix}`);

// ==================== Documents ====================

export async function listDocuments(
  workspaceCode: string,
  params?: { page?: number; page_size?: number; type?: string },
): Promise<{
  items: Document[];
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
  return knlgGet(path(workspaceCode, `/documents${qs ? `?${qs}` : ""}`));
}

export async function getDocument(
  workspaceCode: string,
  id: number,
): Promise<Document> {
  return knlgGet(path(workspaceCode, `/documents/${id}`));
}

export async function uploadDocument(
  workspaceCode: string,
  file: File,
  name: string,
  docType: string,
  sourceUrl?: string,
): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  formData.append("type", docType);
  if (sourceUrl) formData.append("source_url", sourceUrl);
  return knlgUpload(path(workspaceCode, "/upload"), formData);
}

export async function deleteDocument(
  workspaceCode: string,
  id: number,
): Promise<null> {
  return knlgDelete(path(workspaceCode, `/documents/${id}`));
}

// ==================== Import Jobs ====================

export async function listImportJobs(
  workspaceCode: string,
  params?: {
    page?: number;
    page_size?: number;
    document_id?: number;
    status?: string;
  },
): Promise<{
  items: ImportJob[];
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
  return knlgGet(path(workspaceCode, `/jobs${qs ? `?${qs}` : ""}`));
}

export async function getImportJob(
  workspaceCode: string,
  id: number,
): Promise<ImportJob> {
  return knlgGet(path(workspaceCode, `/jobs/${id}`));
}

export async function createImportJob(
  workspaceCode: string,
  data: { document_id: number },
): Promise<ImportJob> {
  return knlgPost(path(workspaceCode, "/jobs"), data);
}

export async function updateImportJobStatus(
  workspaceCode: string,
  id: number,
  data: { status: string; progress?: number; error_message?: string },
): Promise<ImportJob> {
  return knlgPatch(path(workspaceCode, `/jobs/${id}/status`), data);
}

export async function cancelImportJob(
  workspaceCode: string,
  id: number,
): Promise<ImportJob> {
  return knlgPost(path(workspaceCode, `/jobs/${id}/cancel`), {});
}

export async function deleteImportJob(
  workspaceCode: string,
  id: number,
): Promise<null> {
  return knlgDelete(path(workspaceCode, `/jobs/${id}`));
}

export async function listJobChunks(
  workspaceCode: string,
  jobId: number,
): Promise<{ items: unknown[]; total: number }> {
  return knlgGet(path(workspaceCode, `/jobs/${jobId}/chunks`));
}
