/**
 * Recording segment persistence.
 *
 * Each `Segment` is one 10-minute (or shorter, on pause/stop/tab-switch)
 * chunk of rrweb events. Segments are stored in the `recording_segments`
 * object store of the `neo-agent-recordings` IndexedDB.
 *
 * The `synced` flag tracks whether the segment has been uploaded to the
 * backend. Segments with `synced: 0` are surfaced by the popup's Pending
 * state on browser restart.
 */

import { openDb, STORE_SEGMENTS } from './db'

export interface Segment {
  /** UUID, local to the extension (not the backend's segmentUid) */
  uid: string
  /** The recording session this segment belongs to */
  sessionId: string
  /** Monotonically increasing 1-based sequence number within the session */
  sequence: number
  /** ms timestamp */
  startTime: number
  /** ms timestamp */
  endTime: number
  /** rrweb event array */
  events: unknown[]
  /** Unique URLs visited during this segment */
  pageUrls: string[]
  /** 0 = unsynced (pending upload), 1 = synced (uploaded) */
  synced: 0 | 1
  /** ms timestamp */
  createdAt: number
}

export type NewSegment = Omit<Segment, 'createdAt' | 'synced'> & {
  synced?: 0 | 1
}

function txStore(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE_SEGMENTS, mode).objectStore(STORE_SEGMENTS)
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Insert or update a segment. */
export async function putSegment(seg: NewSegment): Promise<void> {
  const db = await openDb()
  const record: Segment = {
    ...seg,
    synced: seg.synced ?? 0,
    createdAt: Date.now(),
  }
  await reqToPromise(txStore(db, 'readwrite').put(record))
}

/** All segments for a session, ordered by sequence ascending. */
export async function getSegmentsBySession(sessionId: string): Promise<Segment[]> {
  const db = await openDb()
  const idx = txStore(db, 'readonly').index('sessionId')
  const all = await reqToPromise<Segment[]>(idx.getAll(sessionId))
  return all.sort((a, b) => a.sequence - b.sequence)
}

/** All unsynced segments across all sessions. */
export async function getUnsyncedSegments(): Promise<Segment[]> {
  const db = await openDb()
  const idx = txStore(db, 'readonly').index('synced')
  const all = await reqToPromise<Segment[]>(idx.getAll(0))
  return all.sort((a, b) => a.startTime - b.startTime)
}

/** Mark a single segment as synced (idempotent). */
export async function markSegmentSynced(uid: string): Promise<void> {
  const db = await openDb()
  const store = txStore(db, 'readwrite')
  const existing = await reqToPromise<Segment | undefined>(store.get(uid))
  if (!existing) return
  existing.synced = 1
  await reqToPromise(store.put(existing))
}

/** Mark many segments as synced in a single transaction. */
export async function markSegmentsSynced(uids: string[]): Promise<void> {
  if (uids.length === 0) return
  const db = await openDb()
  const tx = db.transaction(STORE_SEGMENTS, 'readwrite')
  const store = tx.objectStore(STORE_SEGMENTS)
  for (const uid of uids) {
    const existing = await reqToPromise<Segment | undefined>(store.get(uid))
    if (existing) {
      existing.synced = 1
      store.put(existing)
    }
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Delete all segments for a session (used on upload success or discard). */
export async function deleteSegmentsBySession(sessionId: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE_SEGMENTS, 'readwrite')
  const idx = tx.objectStore(STORE_SEGMENTS).index('sessionId')
  const keys = await reqToPromise<IDBValidKey[]>(idx.getAllKeys(sessionId))
  const store = tx.objectStore(STORE_SEGMENTS)
  for (const k of keys) store.delete(k)
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Look up a single segment by uid. */
export async function getSegmentByUid(uid: string): Promise<Segment | null> {
  const db = await openDb()
  const result = await reqToPromise<Segment | undefined>(txStore(db, 'readonly').get(uid))
  return result ?? null
}

/** Total count of segments for a session (test helper). */
export async function countSegmentsBySession(sessionId: string): Promise<number> {
  const db = await openDb()
  const idx = txStore(db, 'readonly').index('sessionId')
  return reqToPromise<number>(idx.count(sessionId))
}
