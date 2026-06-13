/**
 * Popup App — top-level state machine driver.
 *
 * Renders one of the state components based on:
 *   1. auth state (useAuthBridge)
 *   2. pending state (usePendingState) — only when auth is ok
 *   3. upload state (useUpload) — takes precedence when active
 *   4. recording state (useRecordingState) — the rest
 *
 * The AuthRequired view keeps an invisible iframe in the DOM so that
 * postMessage can deliver the user info payload even when the user
 * hasn't yet logged in to Neo.
 */

import { useState } from 'react'

import { getConfig } from '../../src/config/settings'
import { useAuthBridge } from './hooks/useAuthBridge'
import { usePendingState } from './hooks/usePendingState'
import { useRecordingState } from './hooks/useRecordingState'
import { useUpload } from './hooks/useUpload'

import { AuthRequired } from './states/AuthRequired'
import { Error as ErrorView } from './states/Error'
import { Idle } from './states/Idle'
import { Paused } from './states/Paused'
import { Pending } from './states/Pending'
import { Recording } from './states/Recording'
import { Success } from './states/Success'
import { Uploading } from './states/Uploading'

export function App() {
  const auth = useAuthBridge()
  const pending = usePendingState()
  const recording = useRecordingState()
  const upload = useUpload()

  // The name input for upload is local to App so it survives across state
  // transitions (paused → uploading → success).
  const [pendingUploadName, setPendingUploadName] = useState('')

  // 0. While auth is loading, show a minimal placeholder.
  if (auth.loading) {
    return <div className="w-72 p-3 text-xs text-gray-500 font-sans">连接中…</div>
  }

  // 1. Auth gate.
  if (auth.status !== 'ok' || !auth.userInfo) {
    return (
      <AuthRequired
        status={auth.status}
        onRetry={auth.retry}
        getFrontendUrl={async () => {
          const r = await getConfig()
          return r.ok ? r.config.frontend_base_url : 'http://localhost:3000'
        }}
      />
    )
  }

  // 2. Pending state — only show after auth is ok and upload is idle.
  if (pending.hasUnsynced && upload.status === 'idle') {
    return (
      <Pending
        groups={pending.groups}
        onUpload={async sessionId => {
          const name = pendingUploadName || defaultName()
          await upload.start(sessionId, name, window.location.href)
        }}
        onDiscard={async sessionId => {
          await pending.discardSession(sessionId)
        }}
        onStartNew={async () => {
          // Close the popup; the user can open a new tab to start a
          // fresh recording (the new content script will see no active
          // session and create one).
          window.close()
        }}
        recordingName={pendingUploadName}
        onRecordingNameChange={setPendingUploadName}
      />
    )
  }

  // 3. Upload sub-states take precedence over recording states.
  if (upload.status === 'uploading') {
    return <Uploading recordingName={upload.recordingName} />
  }
  if (upload.status === 'success') {
    return (
      <Success
        frontendUrl={upload.frontendUrl}
        onDone={() => {
          upload.reset()
          pending.refresh()
        }}
      />
    )
  }
  if (upload.status === 'error') {
    return (
      <ErrorView
        error={upload.errorMessage ?? '上传失败'}
        onRetry={async () => {
          // No sessionId in this scope; the upload service resumes via
          // persisted progress. Just trigger a re-fetch.
          pending.refresh()
        }}
        onCancel={() => upload.reset()}
      />
    )
  }

  // 4. No active tab — show a variant of AuthRequired.
  if (recording.status === 'no_active_tab') {
    return (
      <div className="w-72 p-3 font-sans">
        <header className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">
          🔧 Agent Steer
        </header>
        <p className="text-sm text-amber-700 mb-1">⚠️ 请先打开目标软件</p>
        <p className="text-xs text-gray-500">打开目标软件后重新打开此弹窗即可开始录制。</p>
      </div>
    )
  }

  // 5. Recording sub-states.
  if (recording.state.isRecording) {
    return (
      <Recording
        durationMs={recording.state.duration}
        segmentCount={recording.state.segmentCount}
        onPause={recording.pause}
      />
    )
  }

  if (recording.state.isPaused || recording.state.segmentCount > 0) {
    return (
      <Paused
        durationMs={recording.state.duration}
        segmentCount={recording.state.segmentCount}
        recordingName={pendingUploadName}
        onRecordingNameChange={setPendingUploadName}
        onResume={recording.resume}
        onUpload={async () => {
          // The upload service reads sessionId from chrome.storage.session
          // (set by the content script via the coordinator). The current
          // tab may not be the active recorder, but the sessionId is
          // global so the upload works regardless of focus.
          const sessionId = await getActiveSessionId()
          if (!sessionId) {
            throw new Error('未找到 active session')
          }
          await upload.start(sessionId, pendingUploadName || defaultName(), window.location.href)
        }}
        onStop={recording.stop}
      />
    )
  }

  return <Idle onStart={recording.start} />
}

function defaultName(): string {
  const d = new Date()
  return `Recording ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

async function getActiveSessionId(): Promise<string | null> {
  const result = (await chrome.storage.session.get('agent_steer_active_session')) as Record<
    string,
    { sessionId?: string } | undefined
  >
  return result['agent_steer_active_session']?.sessionId ?? null
}
