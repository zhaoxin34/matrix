/**
 * IndexedDB Storage Module
 * 用于存储录制片段和会话信息
 */

import type { Segment, RecordingSession } from "../types";

const DB_NAME = "neo-agent-recordings";
const DB_VERSION = 1;
const SEGMENTS_STORE = "segments";
const SESSIONS_STORE = "sessions";

let dbInstance: IDBDatabase | null = null;

/**
 * 初始化 IndexedDB 数据库
 */
export function initDB(): Promise<IDBDatabase> {
	if (dbInstance) {
		return Promise.resolve(dbInstance);
	}

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => {
			console.error("[IndexedDB] Failed to open database:", request.error);
			reject(request.error);
		};

		request.onsuccess = () => {
			dbInstance = request.result;
			console.log("[IndexedDB] Database opened successfully");
			resolve(dbInstance);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			console.log("[IndexedDB] Upgrading database to version", DB_VERSION);

			// 创建 segments 存储
			if (!db.objectStoreNames.contains(SEGMENTS_STORE)) {
				const segmentsStore = db.createObjectStore(SEGMENTS_STORE, {
					keyPath: "uid",
				});
				segmentsStore.createIndex("sessionId", "sessionId", {
					unique: false,
				});
				segmentsStore.createIndex("createdAt", "createdAt", {
					unique: false,
				});
				segmentsStore.createIndex("synced", "synced", {
					unique: false,
				});
			}

			// 创建 sessions 存储
			if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
				const sessionsStore = db.createObjectStore(SESSIONS_STORE, {
					keyPath: "uid",
				});
				sessionsStore.createIndex("active", "active", {
					unique: false,
				});
				sessionsStore.createIndex("createdAt", "createdAt", {
					unique: false,
				});
			}
		};
	});
}

/**
 * 获取数据库实例
 */
async function getDB(): Promise<IDBDatabase> {
	if (dbInstance) return dbInstance;
	return initDB();
}

// ==================== Segment Operations ====================

/**
 * 保存片段
 */
export async function saveSegment(segment: Segment): Promise<void> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(SEGMENTS_STORE, "readwrite");
		const store = tx.objectStore(SEGMENTS_STORE);
		const request = store.put(segment);

		request.onsuccess = () => {
			console.log(
				"[IndexedDB] Segment saved:",
				segment.uid,
				"synced:",
				segment.synced,
			);
			resolve();
		};
		request.onerror = () => reject(request.error);
	});
}

/**
 * 获取片段
 */
export async function getSegment(uid: string): Promise<Segment | null> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(SEGMENTS_STORE, "readonly");
		const store = tx.objectStore(SEGMENTS_STORE);
		const request = store.get(uid);

		request.onsuccess = () => resolve(request.result || null);
		request.onerror = () => reject(request.error);
	});
}

/**
 * 获取会话的所有片段
 */
export async function getSegmentsBySession(
	sessionId: string,
): Promise<Segment[]> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(SEGMENTS_STORE, "readonly");
		const store = tx.objectStore(SEGMENTS_STORE);
		const index = store.index("sessionId");
		const request = index.getAll(sessionId);

		request.onsuccess = () => {
			// 按 sequence 排序
			const segments = (request.result as Segment[]).sort(
				(a, b) => a.sequence - b.sequence,
			);
			resolve(segments);
		};
		request.onerror = () => reject(request.error);
	});
}

/**
 * 获取所有未同步的片段
 */
export async function getUnsyncedSegments(): Promise<Segment[]> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(SEGMENTS_STORE, "readonly");
		const store = tx.objectStore(SEGMENTS_STORE);
		const request = store.getAll();

		request.onsuccess = () => {
			// Filter to unsynced segments (IndexedDB stores boolean as 0/1)
			const segments = (request.result as Segment[])
				.filter((s) => !s.synced)
				.sort((a, b) => a.createdAt - b.createdAt);
			resolve(segments);
		};
		request.onerror = () => reject(request.error);
	});
}

/**
 * 标记片段已同步
 */
export async function markSegmentSynced(uid: string): Promise<void> {
	const segment = await getSegment(uid);
	if (!segment) return;

	segment.synced = true;
	await saveSegment(segment);
	console.log("[IndexedDB] Segment marked as synced:", uid);
}

/**
 * 删除片段
 */
export async function deleteSegment(uid: string): Promise<void> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(SEGMENTS_STORE, "readwrite");
		const store = tx.objectStore(SEGMENTS_STORE);
		const request = store.delete(uid);

		request.onsuccess = () => {
			console.log("[IndexedDB] Segment deleted:", uid);
			resolve();
		};
		request.onerror = () => reject(request.error);
	});
}

/**
 * 删除会话的所有片段
 */
export async function deleteSegmentsBySession(
	sessionId: string,
): Promise<void> {
	const segments = await getSegmentsBySession(sessionId);
	for (const segment of segments) {
		await deleteSegment(segment.uid);
	}
}

/**
 * 获取片段总数（用于统计）
 */
export async function getSegmentCount(): Promise<number> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(SEGMENTS_STORE, "readonly");
		const store = tx.objectStore(SEGMENTS_STORE);
		const request = store.count();

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

// ==================== Session Operations ====================

/**
 * 保存会话
 */
export async function saveSession(session: RecordingSession): Promise<void> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(SESSIONS_STORE, "readwrite");
		const store = tx.objectStore(SESSIONS_STORE);
		const request = store.put(session);

		request.onsuccess = () => {
			console.log(
				"[IndexedDB] Session saved:",
				session.uid,
				"active:",
				session.active,
			);
			resolve();
		};
		request.onerror = () => reject(request.error);
	});
}

/**
 * 获取会话
 */
export async function getSession(
	uid: string,
): Promise<RecordingSession | null> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(SESSIONS_STORE, "readonly");
		const store = tx.objectStore(SESSIONS_STORE);
		const request = store.get(uid);

		request.onsuccess = () => resolve(request.result || null);
		request.onerror = () => reject(request.error);
	});
}

/**
 * 获取活跃会话
 */
export async function getActiveSession(): Promise<RecordingSession | null> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(SESSIONS_STORE, "readonly");
		const store = tx.objectStore(SESSIONS_STORE);
		const request = store.getAll();

		request.onsuccess = () => {
			// Filter to active session
			const active = (request.result as RecordingSession[]).find(
				(s) => s.active,
			);
			resolve(active || null);
		};
		request.onerror = () => reject(request.error);
	});
}

/**
 * 获取所有会话（按时间倒序）
 */
export async function getAllSessions(): Promise<RecordingSession[]> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(SESSIONS_STORE, "readonly");
		const store = tx.objectStore(SESSIONS_STORE);
		const request = store.getAll();

		request.onsuccess = () => {
			const sessions = (request.result as RecordingSession[]).sort(
				(a, b) => b.createdAt - a.createdAt,
			);
			resolve(sessions);
		};
		request.onerror = () => reject(request.error);
	});
}

/**
 * 结束会话
 */
export async function endSession(uid: string): Promise<void> {
	const session = await getSession(uid);
	if (!session) return;

	session.active = false;
	session.endTime = Date.now();
	await saveSession(session);
	console.log("[IndexedDB] Session ended:", uid);
}

/**
 * 删除会话
 */
export async function deleteSession(uid: string): Promise<void> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(SESSIONS_STORE, "readwrite");
		const store = tx.objectStore(SESSIONS_STORE);
		const request = store.delete(uid);

		request.onsuccess = () => {
			console.log("[IndexedDB] Session deleted:", uid);
			resolve();
		};
		request.onerror = () => reject(request.error);
	});
}

// ==================== Cleanup Operations ====================

/**
 * 清理旧的已同步片段（当存储空间不足时）
 */
export async function cleanupOldSyncedSegments(
	keepCount: number = 50,
): Promise<number> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(SEGMENTS_STORE, "readwrite");
		const store = tx.objectStore(SEGMENTS_STORE);
		const request = store.getAll();

		request.onsuccess = () => {
			// Filter to synced segments
			const syncedSegments = (request.result as Segment[])
				.filter((s) => s.synced)
				.sort((a, b) => a.createdAt - b.createdAt);

			// 删除最旧的已同步片段，保留最近的 keepCount 个
			const toDelete = syncedSegments.slice(
				0,
				Math.max(0, syncedSegments.length - keepCount),
			);
			let deletedCount = 0;

			for (const segment of toDelete) {
				store.delete(segment.uid);
				deletedCount++;
			}

			console.log(
				"[IndexedDB] Cleaned up",
				deletedCount,
				"old synced segments",
			);
			resolve(deletedCount);
		};
		request.onerror = () => reject(request.error);
	});
}

/**
 * 获取存储使用情况
 */
export async function getStorageUsage(): Promise<{
	segmentCount: number;
	sessionCount: number;
	unsyncedCount: number;
}> {
	const segmentCount = await getSegmentCount();
	const sessions = await getAllSessions();
	const unsynced = await getUnsyncedSegments();

	return {
		segmentCount,
		sessionCount: sessions.length,
		unsyncedCount: unsynced.length,
	};
}
