/**
 * Embedded Site Types
 */

export type EmbeddedSiteStatus = "enabled" | "disabled";

export interface EmbeddedSite {
  id: number;
  site_name: string;
  site_url: string;
  description: string | null;
  workspace_id: number;
  status: EmbeddedSiteStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateEmbeddedSiteInput {
  site_name: string;
  site_url: string;
  description?: string;
  status?: EmbeddedSiteStatus;
}

export interface UpdateEmbeddedSiteInput extends Partial<CreateEmbeddedSiteInput> {
  id: number;
}