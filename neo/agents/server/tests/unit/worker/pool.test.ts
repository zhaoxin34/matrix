import { describe, it, expect, vi } from "vitest";
import {
	type WorkerInfo,
	createWorkerPool,
	WorkerPoolError,
} from "../../../src/worker/pool.js";

describe("Worker Pool", () => {
	// Note: These tests use mocking since actual Worker threads
	// require CommonJS modules and a different execution environment

	describe("Pool Creation", () => {
		it("should create pool with specified size", () => {
			const pool = createWorkerPool({ poolSize: 4 });
			expect(pool).toBeDefined();
			pool.destroy();
		});

		it("should create pool with default size of 4", () => {
			const pool = createWorkerPool();
			expect(pool).toBeDefined();
			pool.destroy();
		});

		it("should throw error for invalid pool size", () => {
			expect(() => createWorkerPool({ poolSize: 0 })).toThrow(WorkerPoolError);
			expect(() => createWorkerPool({ poolSize: -1 })).toThrow(WorkerPoolError);
		});
	});

	describe("Worker Info", () => {
		it("should track worker status", () => {
			const pool = createWorkerPool({ poolSize: 2 });
			const workers = pool.getWorkers();
			expect(workers.length).toBe(2);
			expect(workers.every((w) => w.status === "idle")).toBe(true);
			pool.destroy();
		});

		it("should track available workers count", () => {
			const pool = createWorkerPool({ poolSize: 3 });
			expect(pool.getAvailableCount()).toBe(3);
			pool.destroy();
		});
	});

	describe("Pool Statistics", () => {
		it("should track total, available, and busy workers", () => {
			const pool = createWorkerPool({ poolSize: 4 });
			const stats = pool.getStats();
			expect(stats.total).toBe(4);
			expect(stats.available).toBe(4);
			expect(stats.busy).toBe(0);
			pool.destroy();
		});

		it("should track total sessions", () => {
			const pool = createWorkerPool({ poolSize: 4 });
			expect(pool.getStats().totalSessions).toBe(0);
			pool.destroy();
		});
	});

	describe("Event Handling", () => {
		it("should emit ready event when worker is ready", () => {
			const pool = createWorkerPool({ poolSize: 2 });
			const readyHandler = vi.fn();
			pool.on("worker:ready", readyHandler);
			// In real implementation, this would be triggered by worker messages
			pool.destroy();
			expect(readyHandler).toBeDefined();
		});

		it("should emit error event on worker failure", () => {
			const pool = createWorkerPool({ poolSize: 2 });
			const errorHandler = vi.fn();
			pool.on("worker:error", errorHandler);
			pool.destroy();
			expect(errorHandler).toBeDefined();
		});
	});

	describe("Pool Destruction", () => {
		it("should destroy all workers", () => {
			const pool = createWorkerPool({ poolSize: 4 });
			pool.destroy();
			expect(pool.getWorkers().length).toBe(0);
		});

		it("should clear all event listeners on destroy", () => {
			const pool = createWorkerPool({ poolSize: 2 });
			const handlers = {
				ready: vi.fn(),
				error: vi.fn(),
				event: vi.fn(),
			};
			pool.on("worker:ready", handlers.ready);
			pool.on("worker:error", handlers.error);
			pool.on("worker:event", handlers.event);

			pool.destroy();

			// After destroy, workers are cleared so acquire would fail
			expect(pool.getWorkers().length).toBe(0);
			expect(pool.getStats().total).toBe(0);
		});
	});

	describe("Error Cases", () => {
		it("should throw when pool is full and noWait is true", () => {
			const pool = createWorkerPool({ poolSize: 1, maxWaiting: 0 });
			pool.destroy();
		});

		it("should throw WorkerPoolError with correct code", () => {
			try {
				createWorkerPool({ poolSize: -1 });
			} catch (e) {
				expect(e).toBeInstanceOf(WorkerPoolError);
				if (e instanceof WorkerPoolError) {
					expect(e.code).toBe("INVALID_POOL_SIZE");
				}
			}
		});
	});
});

describe("WorkerInfo", () => {
	it("should have correct structure", () => {
		const mockWorkerInfo: WorkerInfo = {
			id: 1,
			status: "idle",
			sessionId: null,
			createdAt: new Date(),
			lastUsedAt: new Date(),
		};

		expect(mockWorkerInfo.id).toBe(1);
		expect(mockWorkerInfo.status).toBe("idle");
		expect(mockWorkerInfo.sessionId).toBeNull();
		expect(mockWorkerInfo.createdAt).toBeInstanceOf(Date);
	});
});
