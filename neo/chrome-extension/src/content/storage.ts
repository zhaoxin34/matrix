/**
 * Content Storage Module
 * Handles IndexedDB storage for recordings
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { eventWithTime } from "@rrweb/types";
import { createLogger } from "@shared/utils";

const logger = createLogger("Storage");

/** Recording data stored in IndexedDB */
export interface Recording {
	id: string;
	sessionId: string;
	events: eventWithTime[];
	startTime: number;
	endTime: number;
	duration: number;
	synced: boolean;
	createdAt: number;
}

/** Database schema */
interface NeoAgentDB extends DBSchema {
	recordings: {
		key: string;
		value: Recording;
		indexes: {
			"by-session": string;
			"by-created": number;
			"by-synced": number;
		};
	};
}

/** Storage module interface */
export interface StorageModule {
	init: () => Promise<void>;
	saveRecording: (recording: Recording) => Promise<string>;
	getRecording: (id: string) => Promise<Recording | null>;
	listRecordings: (limit?: number, offset?: number) => Promise<Recording[]>;
	getUnsyncedRecordings: () => Promise<Recording[]>;
	deleteRecording: (id: string) => Promise<void>;
	markAsSynced: (id: string) => Promise<void>;
	clearAll: () => Promise<void>;
}

/** Create storage module */
export function createStorage(): StorageModule {
	// State
	let _db: IDBPDatabase<NeoAgentDB> | null = null;
	const _dbName = "neo-agent-recordings";
	const _dbVersion = 1;

	/** Initialize database */
	async function init(): Promise<void> {
		if (_db) {
			logger.debug("Database already initialized");
			return;
		}

		logger.info("Initializing database");

		_db = await openDB<NeoAgentDB>(_dbName, _dbVersion, {
			upgrade(db) {
				logger.info("Upgrading database to version:", _dbVersion);

				// Create recordings store
				if (!db.objectStoreNames.contains("recordings")) {
					const store = db.createObjectStore("recordings", {
						keyPath: "id",
					});

					// Create indexes
					store.createIndex("by-session", "sessionId");
					store.createIndex("by-created", "createdAt");
					store.createIndex("by-synced", "synced");

					logger.info("Recordings store created with indexes");
				}
			},
			blocked() {
				logger.warn("Database blocked by older version");
			},
			blocking() {
				logger.warn("Closing database blocking connection");
				_db?.close();
				_db = null;
			},
		});

		logger.info("Database initialized");
	}

	/** Save recording */
	async function saveRecording(recording: Recording): Promise<string> {
		if (!_db) {
			throw new Error("Database not initialized");
		}

		logger.info("Saving recording:", recording.id);

		// Ensure recording has required fields
		const record: Recording = {
			...recording,
			id: recording.id || crypto.randomUUID(),
			createdAt: recording.createdAt || Date.now(),
			synced: recording.synced ?? false,
			duration: recording.endTime - recording.startTime,
		};

		await _db.put("recordings", record);
		logger.info("Recording saved:", record.id);

		return record.id;
	}

	/** Get recording by ID */
	async function getRecording(id: string): Promise<Recording | null> {
		if (!_db) {
			throw new Error("Database not initialized");
		}

		const recording = await _db.get("recordings", id);
		if (!recording) {
			logger.debug("Recording not found:", id);
			return null;
		}

		logger.debug("Recording retrieved:", id);
		return recording;
	}

	/** List recordings with pagination */
	async function listRecordings(limit = 50, offset = 0): Promise<Recording[]> {
		if (!_db) {
			throw new Error("Database not initialized");
		}

		const tx = _db.transaction("recordings", "readonly");
		const index = tx.store.index("by-created");
		const recordings: Recording[] = [];

		let cursor = await index.openCursor(null, "prev");
		let skipped = 0;

		while (cursor) {
			if (skipped < offset) {
				skipped++;
				cursor = await cursor.continue();
				continue;
			}

			recordings.push(cursor.value);
			if (recordings.length >= limit) {
				break;
			}

			cursor = await cursor.continue();
		}

		logger.debug(`Listed ${recordings.length} recordings`);
		return recordings;
	}

	/** Get unsynced recordings */
	async function getUnsyncedRecordings(): Promise<Recording[]> {
		if (!_db) {
			throw new Error("Database not initialized");
		}

		const tx = _db.transaction("recordings", "readonly");
		const index = tx.store.index("by-synced");
		const recordings: Recording[] = [];

		let cursor = await index.openCursor(IDBKeyRange.only(0));
		while (cursor) {
			recordings.push(cursor.value);
			cursor = await cursor.continue();
		}

		logger.debug(`Found ${recordings.length} unsynced recordings`);
		return recordings;
	}

	/** Delete recording */
	async function deleteRecording(id: string): Promise<void> {
		if (!_db) {
			throw new Error("Database not initialized");
		}

		logger.info("Deleting recording:", id);
		await _db.delete("recordings", id);
		logger.info("Recording deleted:", id);
	}

	/** Mark recording as synced */
	async function markAsSynced(id: string): Promise<void> {
		if (!_db) {
			throw new Error("Database not initialized");
		}

		const recording = await getRecording(id);
		if (!recording) {
			logger.warn("Recording not found for marking as synced:", id);
			return;
		}

		recording.synced = true;
		await _db.put("recordings", recording);
		logger.debug("Recording marked as synced:", id);
	}

	/** Clear all recordings */
	async function clearAll(): Promise<void> {
		if (!_db) {
			throw new Error("Database not initialized");
		}

		logger.warn("Clearing all recordings");
		await _db.clear("recordings");
		logger.info("All recordings cleared");
	}

	// Public API
	return {
		init,
		saveRecording,
		getRecording,
		listRecordings,
		getUnsyncedRecordings,
		deleteRecording,
		markAsSynced,
		clearAll,
	};
}

/** Default storage instance */
export const storage = createStorage();
