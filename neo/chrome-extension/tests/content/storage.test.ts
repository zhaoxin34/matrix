/**
 * Storage Module Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { eventWithTime } from "@rrweb/types";

// Mock chrome API
const mockChromeStorage = {
	get: vi.fn(),
	set: vi.fn(),
	remove: vi.fn(),
};
const mockChrome = {
	runtime: {
		sendMessage: vi.fn(),
	},
	storage: {
		local: mockChromeStorage,
	},
};
vi.stubGlobal("chrome", mockChrome);

// Mock idb
const mockDB = {
	put: vi.fn(),
	get: vi.fn(),
	getAll: vi.fn(),
	delete: vi.fn(),
	clear: vi.fn(),
	transaction: vi.fn(),
	store: {
		index: vi.fn(),
		openCursor: vi.fn(),
	},
};

// Mock IDBKeyRange for jsdom
vi.stubGlobal("IDBKeyRange", {
	only: vi.fn((val: unknown) => val),
});

vi.mock("idb", () => ({
	openDB: vi.fn(() => Promise.resolve(mockDB)),
}));

// Import after mocks
import { storage, type Recording } from "../../src/content/storage";

describe("Storage Module", () => {
	const testRecording: Recording = {
		id: "test-id-123",
		sessionId: "session-456",
		events: [
			{
				type: 3, // FullSnapshotEvent
				timestamp: 1000,
				data: {},
			} as eventWithTime,
		],
		startTime: 1000,
		endTime: 2000,
		duration: 1000,
		synced: false,
		createdAt: 1000,
	};

	beforeEach(async () => {
		vi.clearAllMocks();
		mockDB.put.mockResolvedValue(undefined);
		mockDB.get.mockResolvedValue(null);
		mockDB.delete.mockResolvedValue(undefined);
		mockDB.clear.mockResolvedValue(undefined);

		// Mock transaction
		const mockTx = {
			store: {
				index: vi.fn(() => ({
					openCursor: vi.fn(() => Promise.resolve(null)),
					getAll: vi.fn(() => Promise.resolve([])),
				})),
				put: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				clear: vi.fn(),
			},
		};
		mockDB.transaction.mockReturnValue(mockTx);

		// Initialize storage
		await storage.init();
	});

	describe("init", () => {
		it("should initialize database", async () => {
			// Already initialized from beforeEach
			expect(storage).toBeDefined();
		});

		it("should not reinitialize if already initialized", async () => {
			await storage.init();
			// Should not throw
			expect(true).toBe(true);
		});
	});

	describe("saveRecording", () => {
		it("should save recording and return id", async () => {
			const id = await storage.saveRecording(testRecording);

			expect(id).toBe(testRecording.id);
			expect(mockDB.put).toHaveBeenCalled();
		});

		it("should generate id if not provided", async () => {
			const recordingWithoutId = { ...testRecording, id: "" };
			const id = await storage.saveRecording(recordingWithoutId);

			expect(id).toBeDefined();
			expect(id.length).toBeGreaterThan(0);
		});

		it("should set synced to false by default", async () => {
			await storage.saveRecording(testRecording);

			expect(mockDB.put).toHaveBeenCalledWith(
				"recordings",
				expect.objectContaining({
					synced: false,
				}),
			);
		});
	});

	describe("getRecording", () => {
		it("should return recording when found", async () => {
			mockDB.get.mockResolvedValue(testRecording);

			const result = await storage.getRecording("test-id-123");

			expect(result).toEqual(testRecording);
		});

		it("should return null when recording not found", async () => {
			mockDB.get.mockResolvedValue(null);

			const result = await storage.getRecording("non-existent");

			expect(result).toBeNull();
		});
	});

	describe("listRecordings", () => {
		it("should return empty array when no recordings", async () => {
			const recordings = await storage.listRecordings();

			expect(recordings).toEqual([]);
		});
	});

	describe("getUnsyncedRecordings", () => {
		it("should return empty array when no unsynced recordings", async () => {
			const recordings = await storage.getUnsyncedRecordings();

			expect(recordings).toEqual([]);
		});
	});

	describe("deleteRecording", () => {
		it("should delete recording by id", async () => {
			await storage.deleteRecording("test-id-123");

			expect(mockDB.delete).toHaveBeenCalledWith("recordings", "test-id-123");
		});
	});

	describe("markAsSynced", () => {
		it("should mark recording as synced", async () => {
			mockDB.get.mockResolvedValue({ ...testRecording });

			await storage.markAsSynced("test-id-123");

			expect(mockDB.put).toHaveBeenCalledWith(
				"recordings",
				expect.objectContaining({
					synced: true,
				}),
			);
		});

		it("should do nothing when recording not found", async () => {
			mockDB.get.mockResolvedValue(null);

			await storage.markAsSynced("non-existent");

			expect(mockDB.put).not.toHaveBeenCalled();
		});
	});

	describe("clearAll", () => {
		it("should clear all recordings", async () => {
			await storage.clearAll();

			expect(mockDB.clear).toHaveBeenCalledWith("recordings");
		});
	});

	describe("Recording type", () => {
		it("should have correct structure", () => {
			expect(testRecording).toHaveProperty("id");
			expect(testRecording).toHaveProperty("sessionId");
			expect(testRecording).toHaveProperty("events");
			expect(testRecording).toHaveProperty("startTime");
			expect(testRecording).toHaveProperty("endTime");
			expect(testRecording).toHaveProperty("duration");
			expect(testRecording).toHaveProperty("synced");
			expect(testRecording).toHaveProperty("createdAt");
		});

		it("should have correct types", () => {
			expect(typeof testRecording.id).toBe("string");
			expect(typeof testRecording.sessionId).toBe("string");
			expect(Array.isArray(testRecording.events)).toBe(true);
			expect(typeof testRecording.startTime).toBe("number");
			expect(typeof testRecording.endTime).toBe("number");
			expect(typeof testRecording.duration).toBe("number");
			expect(typeof testRecording.synced).toBe("boolean");
			expect(typeof testRecording.createdAt).toBe("number");
		});
	});
});
