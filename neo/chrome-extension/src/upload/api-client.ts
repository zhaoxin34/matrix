/**
 * Backend API client for the recording upload flow.
 *
 * All four endpoints are documented in the openspec specs
 * `recording-upload` and `recording-management`. We do NOT modify those
 * capabilities — we only consume them.
 *
 * On HTTP 401, the user's token is cleared from session storage and an
 * `authRequired` event is emitted via the global event bus. The popup
 * subscribes to this and switches to the AuthRequired state.
 */

import { clearUserInfo, getUserInfo } from '../auth/user-info-store'

export class UploadApiError extends Error {
  readonly httpStatus: number
  readonly backendMessage: string
  /** 5xx and network errors are retryable; 4xx (except 401 which clears auth) are not. */
  readonly retryable: boolean

  constructor(httpStatus: number, backendMessage: string, retryable: boolean) {
    super(`HTTP ${httpStatus}: ${backendMessage}`)
    this.httpStatus = httpStatus
    this.backendMessage = backendMessage
    this.retryable = retryable
  }
}

/** Global event bus for cross-module signals (e.g. auth required). */
class EventBus {
  private listeners = new Map<string, Set<() => void>>()
  on(event: string, listener: () => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(listener)
    return () => this.listeners.get(event)!.delete(listener)
  }
  emit(event: string): void {
    this.listeners.get(event)?.forEach(fn => {
      try {
        fn()
      } catch (err) {
        console.error('[agent-steer] event listener error', err)
      }
    })
  }
}
export const bus = new EventBus()

async function fetchWithAuth(url: string, init: RequestInit = {}): Promise<Response> {
  const userInfo = await getUserInfo()
  if (!userInfo?.token) {
    throw new UploadApiError(401, 'No user info in session storage', false)
  }
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${userInfo.token}`,
      'Content-Type': 'application/json',
    },
  })
  if (res.status === 401) {
    await clearUserInfo()
    bus.emit('authRequired')
  }
  return res
}

async function expectOk(res: Response, retryable: boolean): Promise<unknown> {
  if (res.ok) {
    const body = (await res.json()) as { data?: unknown }
    return body.data
  }
  let message = res.statusText
  try {
    const body = (await res.json()) as { message?: string }
    if (body.message) message = body.message
  } catch {
    /* ignore parse error */
  }
  throw new UploadApiError(res.status, message, retryable)
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 429
}

/* ============================================================
 * Step 1: Create recording
 * ============================================================ */

export interface CreateRecordingInput {
  name: string
  enterUrl: string
  source?: 'agent' | 'upload'
}

export async function createRecording(
  apiBaseUrl: string,
  workspaceCode: string,
  input: CreateRecordingInput
): Promise<{ uid: string }> {
  const res = await fetchWithAuth(
    `${apiBaseUrl}/api/v1/workspaces/${encodeURIComponent(workspaceCode)}/recordings`,
    {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        source: input.source ?? 'agent',
        enter_url: input.enterUrl,
      }),
    }
  )
  const data = (await expectOk(res, isRetryableStatus(res.status))) as { uid: string }
  return data
}

/* ============================================================
 * Step 2: Add segment
 * ============================================================ */

export interface CreateSegmentInput {
  sequence: number
  startTime: number // ms
  endTime: number // ms
  pageUrls: string[]
  storageKey: string
  size: number
}

export async function createSegment(
  apiBaseUrl: string,
  workspaceCode: string,
  recordingUid: string,
  input: CreateSegmentInput
): Promise<{ uid: string }> {
  const res = await fetchWithAuth(
    `${apiBaseUrl}/api/v1/workspaces/${encodeURIComponent(workspaceCode)}/recordings/${encodeURIComponent(recordingUid)}/segments`,
    {
      method: 'POST',
      body: JSON.stringify({
        sequence: input.sequence,
        start_time: new Date(input.startTime).toISOString(),
        end_time: new Date(input.endTime).toISOString(),
        page_urls: input.pageUrls,
        storage_key: input.storageKey,
        size: input.size,
      }),
    }
  )
  const data = (await expectOk(res, isRetryableStatus(res.status))) as { uid: string }
  return data
}

/* ============================================================
 * Step 3: Get presigned upload URL, then PUT the segment bytes
 * ============================================================ */

export interface PresignedUrlRequest {
  filename: string
  contentType: string
}

export interface PresignedUrlResponse {
  url: string
  storageKey: string
}

export async function getPresignedUploadUrl(
  apiBaseUrl: string,
  workspaceCode: string,
  recordingUid: string,
  input: PresignedUrlRequest
): Promise<PresignedUrlResponse> {
  const res = await fetchWithAuth(
    `${apiBaseUrl}/api/v1/workspaces/${encodeURIComponent(workspaceCode)}/recordings/${encodeURIComponent(recordingUid)}/segments/presigned`,
    {
      method: 'POST',
      body: JSON.stringify({
        filename: input.filename,
        content_type: input.contentType,
      }),
    }
  )
  const data = (await expectOk(res, isRetryableStatus(res.status))) as PresignedUrlResponse
  return data
}

/**
 * Upload segment bytes via the backend's `PUT /segments/{segmentUid}/bytes`
 * proxy endpoint (rustfs lacks CORS, so we route through the backend).
 * See backend/src/app/api/v1/recording.py:upload_segment_bytes.
 */
export async function uploadSegmentBytes(
  apiBaseUrl: string,
  workspaceCode: string,
  recordingUid: string,
  segmentUid: string,
  events: unknown[]
): Promise<{ storageKey: string; size: number }> {
  const userInfo = await getUserInfo()
  if (!userInfo?.token) {
    throw new UploadApiError(401, 'No user info in session storage', false)
  }
  const body = JSON.stringify(events)
  const res = await fetch(
    `${apiBaseUrl}/api/v1/workspaces/${encodeURIComponent(workspaceCode)}/recordings/${encodeURIComponent(recordingUid)}/segments/${encodeURIComponent(segmentUid)}/bytes`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json',
      },
      body,
    }
  )
  if (res.status === 401) {
    await clearUserInfo()
    bus.emit('authRequired')
  }
  const data = (await expectOk(res, isRetryableStatus(res.status))) as {
    storage_key: string
    size: number
  }
  return { storageKey: data.storage_key, size: data.size }
}

/* ============================================================
 * Step 4: Mark recording completed
 * ============================================================ */

export interface CompleteRecordingInput {
  exitUrl: string
  totalDuration: number // ms
}

export async function markCompleted(
  apiBaseUrl: string,
  workspaceCode: string,
  recordingUid: string,
  input: CompleteRecordingInput
): Promise<unknown> {
  const res = await fetchWithAuth(
    `${apiBaseUrl}/api/v1/workspaces/${encodeURIComponent(workspaceCode)}/recordings/${encodeURIComponent(recordingUid)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        status: 'completed',
        exit_url: input.exitUrl,
        total_duration: input.totalDuration,
      }),
    }
  )
  return expectOk(res, isRetryableStatus(res.status))
}
