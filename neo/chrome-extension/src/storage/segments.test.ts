/**
 * Integration tests for segments storage.
 * Uses fake-indexeddb to polyfill `indexedDB` globally in the node test env.
 */

import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  countSegmentsBySession,
  deleteSegmentsBySession,
  getSegmentByUid,
  getSegmentsBySession,
  getUnsyncedSegments,
  markSegmentSynced,
  markSegmentsSynced,
  putSegment,
  type Segment,
} from './segments'
import { _resetDbForTests, _closeDbForTests } from './db'

function makeSegment(overrides: Partial<Segment> = {}): Segment {
  return {
    uid: `seg-${Math.random().toString(36).slice(2)}`,
    sessionId: 'session-A',
    sequence: 1,
    startTime: 1_000_000,
    endTime: 1_001_000,
    events: [{ type: 4, data: {} }],
    pageUrls: ['https://example.com'],
    synced: 0,
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('segments storage', () => {
  beforeEach(async () => {
    // Close any cached connection, drop the DB, then re-open fresh.
    await _closeDbForTests()
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('neo-agent-recordings')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () => resolve()
    })
    _resetDbForTests()
  })

  it('round-trips a segment through putSegment and getSegmentByUid', async () => {
    const s = makeSegment({ uid: 'seg-roundtrip' })
    await putSegment(s)
    const got = await getSegmentByUid('seg-roundtrip')
    expect(got).not.toBeNull()
    expect(got?.uid).toBe('seg-roundtrip')
    expect(got?.sessionId).toBe('session-A')
    expect(got?.synced).toBe(0)
  })

  it('defaults synced to 0 when not provided', async () => {
    await putSegment({ ...makeSegment(), synced: undefined as unknown as 0 | 1 })
    const got = await getUnsyncedSegments()
    expect(got).toHaveLength(1)
  })

  it('getSegmentsBySession returns segments ordered by sequence', async () => {
    await putSegment(makeSegment({ uid: 's1', sequence: 2 }))
    await putSegment(makeSegment({ uid: 's2', sequence: 1 }))
    await putSegment(makeSegment({ uid: 's3', sequence: 3, sessionId: 'other' }))
    const list = await getSegmentsBySession('session-A')
    expect(list.map(s => s.uid)).toEqual(['s2', 's1'])
  })

  it('getUnsyncedSegments filters by synced=0 and ignores synced=1', async () => {
    await putSegment(makeSegment({ uid: 'u1', synced: 0 }))
    await putSegment(makeSegment({ uid: 'u2', synced: 1 }))
    const list = await getUnsyncedSegments()
    expect(list.map(s => s.uid)).toEqual(['u1'])
  })

  it('markSegmentSynced flips the synced flag', async () => {
    await putSegment(makeSegment({ uid: 'to-sync' }))
    await markSegmentSynced('to-sync')
    const after = await getSegmentByUid('to-sync')
    expect(after?.synced).toBe(1)
    const unsynced = await getUnsyncedSegments()
    expect(unsynced.find(s => s.uid === 'to-sync')).toBeUndefined()
  })

  it('markSegmentSynced is a no-op for unknown uids', async () => {
    await markSegmentSynced('does-not-exist') // should not throw
  })

  it('markSegmentsSynced updates a batch', async () => {
    await putSegment(makeSegment({ uid: 'b1' }))
    await putSegment(makeSegment({ uid: 'b2' }))
    await markSegmentsSynced(['b1', 'b2'])
    const list = await getUnsyncedSegments()
    expect(list).toHaveLength(0)
  })

  it('deleteSegmentsBySession removes only the matching session', async () => {
    await putSegment(makeSegment({ uid: 'd1', sessionId: 'to-delete' }))
    await putSegment(makeSegment({ uid: 'd2', sessionId: 'to-delete' }))
    await putSegment(makeSegment({ uid: 'k1', sessionId: 'keep' }))
    await deleteSegmentsBySession('to-delete')
    expect(await countSegmentsBySession('to-delete')).toBe(0)
    expect(await countSegmentsBySession('keep')).toBe(1)
  })

  it('preserves the legacy `recordings` object store across v1 → v2 migration', async () => {
    // Pre-populate v1 schema with a fake `recordings` record.
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('neo-agent-recordings', 1)
      req.onupgradeneeded = () => {
        req.result.createObjectStore('recordings', { keyPath: 'id' })
      }
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('recordings', 'readwrite')
        tx.objectStore('recordings').put({ id: 'legacy-1', name: 'old' })
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
    _resetDbForTests()

    // Now open with v2 — migration should run, recordings preserved, segments created.
    const s = makeSegment({ uid: 'after-migration' })
    await putSegment(s)
    expect(await getSegmentByUid('after-migration')).not.toBeNull()

    // Confirm legacy record still readable
    const legacy = await new Promise<unknown>((resolve, reject) => {
      const req = indexedDB.open('neo-agent-recordings', 2)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('recordings', 'readonly')
        const r = tx.objectStore('recordings').get('legacy-1')
        r.onsuccess = () => {
          db.close()
          resolve(r.result)
        }
        r.onerror = () => reject(r.error)
      }
      req.onerror = () => reject(req.error)
    })
    expect((legacy as { name: string }).name).toBe('old')
  })
})
