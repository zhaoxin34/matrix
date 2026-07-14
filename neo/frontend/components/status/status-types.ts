/**
 * Status Types
 */

export interface Status {
  id: number;
  entity_type: string;
  entity_id: string;
  attributes: Record<string, unknown>;
  stat_at: string;
  source: string | null;
  session_id: string | null;
  workspace_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateStatusInput {
  entity_type: string;
  entity_id: string;
  attributes: Record<string, unknown>;
  stat_at: string;
  source?: string;
  session_id?: string;
}

export type UpdateStatusInput = Partial<Omit<CreateStatusInput, "stat_at">>;
