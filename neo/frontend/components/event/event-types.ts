/**
 * Event Types
 */

export interface Event {
	id: number;
	name: string;
	entity_name: string;
	target_entity_name: string | null;
	actor: string;
	timestamp: string;
	page_url: string | null;
	session_id: string | null;
	metadata: Record<string, unknown> | null;
	workspace_id: number;
	embedded_site_id: number | null;
	created_by: number;
	created_at: string;
	updated_at: string;
}

export interface CreateEventInput {
	name: string;
	entity_name: string;
	target_entity_name?: string;
	actor: string;
	timestamp: string;
	page_url?: string;
	session_id?: string;
	metadata?: Record<string, unknown>;
	embedded_site_id?: number;
}

export type UpdateEventInput = Partial<Omit<CreateEventInput, "timestamp">> & {
	timestamp?: string;
};
