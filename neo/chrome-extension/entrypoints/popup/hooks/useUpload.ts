/**
 * useUpload — orchestrates the upload flow from the popup.
 *
 * States: idle | uploading | success | error
 */

import { useCallback, useState } from 'react'

import { uploadRecording } from '../../../src/upload/service'

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface UploadHook {
  status: UploadStatus
  recordingName: string
  recordingUid: string | null
  frontendUrl: string | null
  errorMessage: string | null
  start: (sessionId: string, name: string, enterUrl: string) => Promise<void>
  reset: () => void
}

export function useUpload(): UploadHook {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [recordingName, setRecordingName] = useState('')
  const [recordingUid, setRecordingUid] = useState<string | null>(null)
  const [frontendUrl, setFrontendUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const start = useCallback(async (sessionId: string, name: string, enterUrl: string) => {
    setRecordingName(name)
    setStatus('uploading')
    setErrorMessage(null)
    setRecordingUid(null)
    setFrontendUrl(null)
    try {
      const result = await uploadRecording(sessionId, name, enterUrl)
      setRecordingUid(result.recordingUid)
      setFrontendUrl(result.frontendUrl)
      setStatus('success')
    } catch (err) {
      setErrorMessage((err as Error).message)
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setRecordingName('')
    setRecordingUid(null)
    setFrontendUrl(null)
    setErrorMessage(null)
  }, [])

  return { status, recordingName, recordingUid, frontendUrl, errorMessage, start, reset }
}
