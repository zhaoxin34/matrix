/**
 * useRecordingState — manages recording state in the popup.
 *
 * On mount:
 *   1. Resolves the active tab id.
 *   2. Sends `recording.fetch` to query current state.
 *   3. Subscribes to `recording.state` events for that tab.
 *
 * Exposes high-level actions: start / pause / resume / stop.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { sendCommand, sendRecordingCommand } from '../../../src/messaging/popup-client'
import {
  makeCommand,
  type RecordingStateEvent,
  type RecordingEvent,
} from '../../../src/messaging/protocol'

export interface RecordingStateSnapshot {
  isRecording: boolean
  isPaused: boolean
  duration: number
  segmentCount: number
  eventCount: number
  sessionId: string
  isActiveRecorder: boolean
  error?: string
}

export type ConnectionStatus = 'connecting' | 'connected' | 'no_active_tab' | 'error'

export interface RecordingStateHook {
  status: ConnectionStatus
  state: RecordingStateSnapshot
  start: () => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  stop: () => Promise<void>
}

const DEFAULT_STATE: RecordingStateSnapshot = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  segmentCount: 0,
  eventCount: 0,
  sessionId: '',
  isActiveRecorder: false,
}

async function getActiveTabId(): Promise<number | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tabs.length === 0) return null
  return tabs[0].id ?? null
}

export function useRecordingState(): RecordingStateHook {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [state, setState] = useState<RecordingStateSnapshot>(DEFAULT_STATE)
  const tabIdRef = useRef<number | null>(null)

  const connect = useCallback(async () => {
    const tabId = await getActiveTabId()
    if (tabId == null) {
      setStatus('no_active_tab')
      return
    }
    tabIdRef.current = tabId
    setStatus('connected')
    try {
      // Ask the content script for current state.
      const cmd = makeCommand('recording.fetch', {}) as unknown as Parameters<typeof sendCommand>[1]
      const evt = (await sendCommand(tabId, cmd)) as RecordingStateEvent | RecordingEvent
      const payload = 'payload' in evt ? evt.payload : null
      if (payload && 'isRecording' in payload) {
        setState(payload as RecordingStateSnapshot)
      }
    } catch {
      // No active content script yet — keep default state.
    }
  }, [])

  useEffect(() => {
    void connect()
  }, [connect])

  // Periodically re-fetch state to keep the popup in sync (e.g. when a
  // recording.state event arrives from a tab we're not focused on).
  // We don't subscribe to events directly because chrome.runtime.onMessage
  // in the popup is set up once in main.tsx; this hook just provides the
  // latest snapshot. For a robust impl, a shared event bus would be ideal.
  useEffect(() => {
    const interval = setInterval(() => {
      const tabId = tabIdRef.current
      if (tabId == null) return
      const cmd = makeCommand('recording.fetch', {}) as unknown as Parameters<typeof sendCommand>[1]
      sendCommand(tabId, cmd)
        .then(evt => {
          const e = evt as RecordingStateEvent
          if (e?.payload) setState(e.payload as RecordingStateSnapshot)
        })
        .catch(() => undefined)
    }, 2_000)
    return () => clearInterval(interval)
  }, [])

  const start = useCallback(async () => {
    const tabId = tabIdRef.current
    if (tabId == null) return
    await sendRecordingCommand(tabId, 'recording.start', { sessionId: crypto.randomUUID() })
  }, [])

  const pause = useCallback(async () => {
    const tabId = tabIdRef.current
    if (tabId == null) return
    await sendRecordingCommand(tabId, 'recording.pause', {})
  }, [])

  const resume = useCallback(async () => {
    const tabId = tabIdRef.current
    if (tabId == null) return
    await sendRecordingCommand(tabId, 'recording.resume', {})
  }, [])

  const stop = useCallback(async () => {
    const tabId = tabIdRef.current
    if (tabId == null) return
    await sendRecordingCommand(tabId, 'recording.stop', {})
  }, [])

  return { status, state, start, pause, resume, stop }
}
