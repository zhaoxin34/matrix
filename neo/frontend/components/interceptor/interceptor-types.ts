"use client";

/**
 * Interceptor Types
 */

export interface Trigger {
	type: "dom" | "network";
	selector?: string;
	url_pattern?: string;
	method?: string;
}

export interface Action {
	type: string;
	config: Record<string, unknown>;
}

export interface Interceptor {
	id: number;
	workspace_id: number;
	embedded_site_id: number;
	name: string;
	event_name: string;
	mode: "observe" | "intercept";
	entity_name: string;
	target_entity_name: string | null;
	trigger_type: "dom" | "network" | null;
	trigger: Trigger;
	before_actions: Action[];
	after_actions: Action[];
	page_url_pattern: string | null;
	debounce_ms: number;
	status: "ENABLED" | "DISABLED";
	created_at: string;
	updated_at: string;
	created_by: number;
}

export interface InterceptorFilter {
	embedded_site_id?: number;
	status?: "ENABLED" | "DISABLED";
	name?: string;
	page?: number;
	page_size?: number;
}
