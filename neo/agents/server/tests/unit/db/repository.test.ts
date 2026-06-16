import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Knex } from "knex";
import {
	type DatabaseRepository,
	SessionRepository,
	MessageRepository,
	type CreateSessionInput,
	type CreateMessageInput,
} from "../../../src/db/repository.js";
import {
	createTables,
	dropTables,
	tableNames,
} from "../../../src/db/schema.js";

describe("Session Repository", () => {
	let knex: Knex;
	let repo: SessionRepository;

	beforeEach(async () => {
		// Use in-memory SQLite for testing
		const { default: knexInstance } = await import("knex");
		knex = knexInstance({
			client: "better-sqlite3",
			connection: { filename: ":memory:" },
			useNullAsDefault: true,
		});

		await createTables(knex);
		repo = new SessionRepository(knex);
	});

	afterEach(async () => {
		await dropTables(knex);
		await knex.destroy();
	});

	describe("create()", () => {
		it("should create session with auto-generated ID", async () => {
			const session = await repo.create();
			expect(session.id).toBeDefined();
			expect(session.id.length).toBe(36); // UUID format
		});

		it("should create session with custom ID", async () => {
			const session = await repo.create({ id: "custom-id-123" });
			expect(session.id).toBe("custom-id-123");
		});

		it("should create session with custom properties", async () => {
			const session = await repo.create({
				userId: "user-456",
				workerId: 3,
				cwd: "/workspace",
				modelId: "claude-3-5",
				thinkingLevel: "high",
			});

			expect(session.user_id).toBe("user-456");
			expect(session.worker_id).toBe(3);
			expect(session.cwd).toBe("/workspace");
			expect(session.model_id).toBe("claude-3-5");
			expect(session.thinking_level).toBe("high");
		});

		it("should set default values", async () => {
			const session = await repo.create();
			expect(session.status).toBe("idle");
			expect(session.cwd).toBe("/tmp");
			expect(session.thinking_level).toBe("medium");
		});
	});

	describe("getById()", () => {
		it("should return session by ID", async () => {
			const created = await repo.create({ id: "test-session" });
			const found = await repo.getById("test-session");
			expect(found?.id).toBe("test-session");
		});

		it("should return null for non-existent ID", async () => {
			const found = await repo.getById("non-existent");
			expect(found).toBeNull();
		});
	});

	describe("getAll()", () => {
		it("should return all sessions ordered by created_at desc", async () => {
			await repo.create({ id: "session-1" });
			await repo.create({ id: "session-2" });
			await repo.create({ id: "session-3" });

			const sessions = await repo.getAll();
			expect(sessions.length).toBe(3);
			expect(sessions[0].id).toBe("session-3"); // Most recent first
		});
	});

	describe("getByStatus()", () => {
		it("should filter sessions by status", async () => {
			await repo.create({ id: "idle-1" });
			await repo.create({ id: "active-1", workerId: 1 });
			await repo.update("active-1", { status: "active" });

			const idle = await repo.getByStatus("idle");
			const active = await repo.getByStatus("active");

			expect(idle.length).toBe(1);
			expect(idle[0].id).toBe("idle-1");
			expect(active.length).toBe(1);
			expect(active[0].id).toBe("active-1");
		});
	});

	describe("update()", () => {
		it("should update session properties", async () => {
			await repo.create({ id: "test-session" });

			const updated = await repo.update("test-session", {
				workerId: 5,
				status: "active",
			});

			expect(updated?.worker_id).toBe(5);
			expect(updated?.status).toBe("active");
		});

		it("should update timestamps", async () => {
			const session = await repo.create({ id: "test-session" });
			const originalUpdated = session.updated_at;

			// Wait a bit to ensure timestamp difference
			await new Promise((resolve) => setTimeout(resolve, 10));

			await repo.update("test-session", { status: "active" });
			const updated = await repo.getById("test-session");

			expect(updated!.updated_at > originalUpdated).toBe(true);
		});
	});

	describe("delete()", () => {
		it("should delete session", async () => {
			await repo.create({ id: "to-delete" });
			const deleted = await repo.delete("to-delete");

			expect(deleted).toBe(true);
			expect(await repo.getById("to-delete")).toBeNull();
		});

		it("should return false for non-existent session", async () => {
			const deleted = await repo.delete("non-existent");
			expect(deleted).toBe(false);
		});
	});

	describe("getActiveCount()", () => {
		it("should count active sessions", async () => {
			await repo.create({ id: "s1" });
			await repo.create({ id: "s2" });
			await repo.update("s2", { status: "active" });
			await repo.create({ id: "s3" });
			await repo.update("s3", { status: "paused" });

			const count = await repo.getActiveCount();
			expect(count).toBe(2);
		});
	});
});

describe("Message Repository", () => {
	let knex: Knex;
	let messageRepo: MessageRepository;
	let sessionRepo: SessionRepository;

	beforeEach(async () => {
		const { default: knexInstance } = await import("knex");
		knex = knexInstance({
			client: "better-sqlite3",
			connection: { filename: ":memory:" },
			useNullAsDefault: true,
		});

		await createTables(knex);
		messageRepo = new MessageRepository(knex);
		sessionRepo = new SessionRepository(knex);
	});

	afterEach(async () => {
		await dropTables(knex);
		await knex.destroy();
	});

	describe("create()", () => {
		it("should create message with session ID", async () => {
			await sessionRepo.create({ id: "session-1" });
			const message = await messageRepo.create({
				sessionId: "session-1",
				role: "user",
				content: "Hello, world!",
			});

			expect(message.id).toBeDefined();
			expect(message.session_id).toBe("session-1");
			expect(message.role).toBe("user");
			expect(message.content).toBe("Hello, world!");
		});
	});

	describe("getBySessionId()", () => {
		it("should return messages ordered by created_at", async () => {
			await sessionRepo.create({ id: "session-1" });
			await messageRepo.create({
				sessionId: "session-1",
				role: "user",
				content: "First",
			});
			await messageRepo.create({
				sessionId: "session-1",
				role: "assistant",
				content: "Second",
			});
			await messageRepo.create({
				sessionId: "session-1",
				role: "user",
				content: "Third",
			});

			const messages = await messageRepo.getBySessionId("session-1");
			expect(messages.length).toBe(3);
			expect(messages[0].content).toBe("First");
			expect(messages[2].content).toBe("Third");
		});
	});

	describe("getCountBySessionId()", () => {
		it("should return correct count", async () => {
			await sessionRepo.create({ id: "session-1" });
			await messageRepo.create({
				sessionId: "session-1",
				role: "user",
				content: "A",
			});
			await messageRepo.create({
				sessionId: "session-1",
				role: "assistant",
				content: "B",
			});

			const count = await messageRepo.getCountBySessionId("session-1");
			expect(count).toBe(2);
		});
	});

	describe("deleteBySessionId()", () => {
		it("should delete all messages for session", async () => {
			await sessionRepo.create({ id: "session-1" });
			await messageRepo.create({
				sessionId: "session-1",
				role: "user",
				content: "A",
			});
			await messageRepo.create({
				sessionId: "session-1",
				role: "user",
				content: "B",
			});

			const deleted = await messageRepo.deleteBySessionId("session-1");
			expect(deleted).toBe(2);
			expect(await messageRepo.getBySessionId("session-1")).toHaveLength(0);
		});
	});
});
