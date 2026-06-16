/**
 * Database Schema Definitions
 *
 * Tables for session persistence.
 * Compatible with MySQL and SQLite.
 */

import type { Knex } from "knex";

export const tableNames = {
	sessions: "sessions",
	messages: "messages",
} as const;

export interface SessionRow {
	id: string;
	user_id: string | null;
	worker_id: number | null;
	cwd: string;
	model_id: string | null;
	thinking_level: string;
	status: "idle" | "active" | "paused" | "terminated";
	created_at: Date;
	updated_at: Date;
	last_active_at: Date;
}

export interface MessageRow {
	id: string;
	session_id: string;
	role: "user" | "assistant" | "system" | "tool";
	content: string;
	created_at: Date;
}

/**
 * Create all tables
 */
export async function createTables(knex: Knex): Promise<void> {
	// Sessions table
	const hasSessions = await knex.schema.hasTable(tableNames.sessions);
	if (!hasSessions) {
		await knex.schema.createTable(tableNames.sessions, (table) => {
			table.string("id", 36).primary();
			table.string("user_id", 64).nullable().index();
			table.integer("worker_id").nullable();
			table.string("cwd", 512).defaultTo("/tmp");
			table.string("model_id", 128).nullable();
			table.string("thinking_level", 16).defaultTo("medium");
			table.string("status", 16).defaultTo("idle");
			table.datetime("created_at").defaultTo(knex.fn.now());
			table.datetime("updated_at").defaultTo(knex.fn.now());
			table.datetime("last_active_at").defaultTo(knex.fn.now());

			// Indexes
			table.index("status");
			table.index("created_at");
		});
	}

	// Messages table
	const hasMessages = await knex.schema.hasTable(tableNames.messages);
	if (!hasMessages) {
		await knex.schema.createTable(tableNames.messages, (table) => {
			table.string("id", 36).primary();
			table.string("session_id", 36).notNullable().index();
			table.string("role", 16).notNullable();
			table.text("content").notNullable();
			table.datetime("created_at").defaultTo(knex.fn.now());

			// Foreign key
			table
				.foreign("session_id")
				.references("id")
				.inTable(tableNames.sessions)
				.onDelete("CASCADE");
		});
	}
}

/**
 * Drop all tables (for testing only!)
 */
export async function dropTables(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists(tableNames.messages);
	await knex.schema.dropTableIfExists(tableNames.sessions);
}

/**
 * Migration tracker (for future migrations)
 */
export async function ensureMigrationTable(knex: Knex): Promise<void> {
	const hasMigrations = await knex.schema.hasTable("migrations");
	if (!hasMigrations) {
		await knex.schema.createTable("migrations", (table) => {
			table.increments("id").primary();
			table.string("name", 255).notNullable().unique();
			table.datetime("applied_at").defaultTo(knex.fn.now());
		});
	}
}
