/**
 * IndexedDB database setup.
 *
 * Database: `neo-agent-recordings`
 * - v1: `recordings` object store (existing, owned by other capability)
 * - v2: add `recording_segments` object store with keyPath `uid` and
 *       indexes on `sessionId`, `sequence`, `synced`
 *
 * The v1 → v2 migration is purely additive; existing data in `recordings`
 * is preserved untouched.
 */

export const DB_NAME = 'neo-agent-recordings'
export const DB_VERSION = 2

export const STORE_RECORDINGS = 'recordings' // existing (v1)
export const STORE_SEGMENTS = 'recording_segments' // new in v2

let dbPromise: Promise<IDBDatabase> | null = null

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = event => {
      const db = req.result
      const oldVersion = event.oldVersion

      if (oldVersion < 1) {
        // v1: existing recordings store (created by other capability).
        // We don't define its schema here; we only ensure it exists so
        // migrations from v1 keep working. If a different capability owns
        // this store, it should be defined there. We declare it as a
        // placeholder to avoid the open() call failing when this module
        // loads first.
        if (!db.objectStoreNames.contains(STORE_RECORDINGS)) {
          db.createObjectStore(STORE_RECORDINGS, { keyPath: 'id' })
        }
      }

      if (oldVersion < 2) {
        // v2: recording_segments store
        if (!db.objectStoreNames.contains(STORE_SEGMENTS)) {
          const store = db.createObjectStore(STORE_SEGMENTS, { keyPath: 'uid' })
          store.createIndex('sessionId', 'sessionId', { unique: false })
          store.createIndex('sequence', 'sequence', { unique: false })
          store.createIndex('synced', 'synced', { unique: false })
        }
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

/** Close and clear the cached connection (mainly for tests). */
export function _resetDbForTests(): void {
  dbPromise = null
}

/** Close the cached connection if any (test helper). */
export async function _closeDbForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise
    db.close()
    dbPromise = null
  }
}
