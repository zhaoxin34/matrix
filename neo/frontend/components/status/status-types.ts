/**
 * Status Types
 */

export interface Status {
	id: number;
	entity_name: string;
	attributes: Record<string, unknown>;
	captured_at: string;
	source: string | null;
	session_id: string | null;
	workspace_id: number;
	embedded_site_id: number | null;
	created_by: number;
	created_at: string;
	updated_at: string;
}

export interface CreateStatusInput {
	entity_name: string;
	attributes: Record<string, unknown>;
	captured_at: string;
	source?: string;
	session_id?: string;
	embedded_site_id?: number;
}

export type UpdateStatusInput = Partial<Omit<CreateStatusInput, "captured_at">>;
