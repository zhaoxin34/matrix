/**
 * usePendingState — detects unsynced segments from IndexedDB on mount
 * and exposes upload / discard actions.
 *
 * On browser restart or popup open in a new tab, unsynced segments may
 * exist in IndexedDB. The popup's App should render the Pending view
 * whenever `hasUnsynced` is true (after auth is ok).
 */

import { useCallback, useEffect, useState } from 'react'

import { getUnsyncedSegments, deleteSegmentsBySession } from '../../../src/storage/segments'
import type { Segment } from '../../../src/storage/segments'

export interface PendingGroup {
  sessionId: string
  segmentCount: number
  totalDuration: number
  earliestStart: number
  latestStart: number
}

export interface PendingState {
  groups: PendingGroup[]
  hasUnsynced: boolean
  loading: boolean
  refresh: () => void
  discardSession: (sessionId: string) => Promise<void>
}

function groupBySession(segments: Segment[]): PendingGroup[] {
  const bySession = new Map<string, Segment[]>()
  for (const s of segments) {
    const arr = bySession.get(s.sessionId) ?? []
    arr.push(s)
    bySession.set(s.sessionId, arr)
  }
  return [...bySession.entries()].map(([sessionId, segs]) => ({
    sessionId,
    segmentCount: segs.length,
    totalDuration: segs.reduce((sum, s) => sum + Math.max(0, s.endTime - s.startTime), 0),
    earliestStart: Math.min(...segs.map(s => s.startTime)),
    latestStart: Math.max(...segs.map(s => s.startTime)),
  }))
}

export function usePendingState(): PendingState {
  const [groups, setGroups] = useState<PendingGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshNonce, setRefreshNonce] = useState(0)

  const refresh = useCallback(() => setRefreshNonce(n => n + 1), [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const segs = await getUnsyncedSegments()
      if (cancelled) return
      setGroups(groupBySession(segs))
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [refreshNonce])

  const discard = useCallback(
    async (sessionId: string) => {
      await deleteSegmentsBySession(sessionId)
      refresh()
    },
    [refresh]
  )

  return {
    groups,
    hasUnsynced: groups.length > 0,
    loading,
    refresh,
    discardSession: discard,
  }
}
