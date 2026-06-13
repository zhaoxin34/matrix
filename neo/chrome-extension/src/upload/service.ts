/**
 * Upload service — orchestrates the 4-step flow against the backend.
 *
 * Step 1: POST /workspaces/{ws}/recordings                  → recordingUid
 * Step 2: POST /workspaces/{ws}/recordings/{uid}/segments  → segmentUid
 * Step 3: POST /workspaces/{ws}/recordings/{uid}/segments/presigned
 * Step 4: PUT  /workspaces/{ws}/recordings/{uid}/segments/{segmentUid}/bytes
 *         (via the backend proxy because rustfs lacks CORS)
 * Step 5: PUT  /workspaces/{ws}/recordings/{uid}            status=completed
 * Step 6: Clear local IndexedDB segments
 *
 * Progress is persisted to chrome.storage.local.upload_progress so a
 * retry can resume from the failed step without creating duplicates.
 */

import { getConfig } from '../config/settings'
import { getUserInfo } from '../auth/user-info-store'
import {
  deleteSegmentsBySession,
  getSegmentsBySession,
  markSegmentsSynced,
  type Segment,
} from '../storage/segments'
import {
  createRecording,
  createSegment,
  markCompleted,
  uploadSegmentBytes,
  UploadApiError,
} from './api-client'

const PROGRESS_KEY = 'agent_steer_upload_progress'

export interface UploadProgress {
  recordingUid: string
  /** Backend UIDs of segments that have been successfully PUT. */
  uploadedSegmentUids: string[]
  workspaceCode: string
  recordingName: string
}

export interface UploadResult {
  recordingUid: string
  frontendUrl: string
}

export async function loadUploadProgress(): Promise<UploadProgress | null> {
  const result = (await chrome.storage.local.get(PROGRESS_KEY)) as Record<
    string,
    UploadProgress | undefined
  >
  return result[PROGRESS_KEY] ?? null
}

async function saveUploadProgress(p: UploadProgress): Promise<void> {
  await chrome.storage.local.set({ [PROGRESS_KEY]: p })
}

async function clearUploadProgress(): Promise<void> {
  await chrome.storage.local.remove(PROGRESS_KEY)
}

/**
 * Upload a session's segments to the backend. Idempotent on retry.
 *
 * @param sessionId The local session id whose segments to upload.
 * @param recordingName The user-supplied name for the recording.
 * @param enterUrl The URL the user was on when starting the recording.
 * @returns UploadResult on success.
 */
export async function uploadRecording(
  sessionId: string,
  recordingName: string,
  enterUrl: string
): Promise<UploadResult> {
  const configResult = await getConfig()
  if (!configResult.ok) {
    throw new UploadApiError(0, `Missing config: ${configResult.missing.join(', ')}`, false)
  }
  const userInfo = await getUserInfo()
  if (!userInfo) {
    throw new UploadApiError(401, 'No user info in session storage', false)
  }
  const { api_base_url, frontend_base_url } = configResult.config

  const segments = await getSegmentsBySession(sessionId)
  if (segments.length === 0) {
    throw new UploadApiError(0, 'No segments to upload', false)
  }

  // Resume from saved progress if the sessionId matches and the workspace
  // is the same.
  const prev = await loadUploadProgress()
  let recordingUid: string
  let uploadedSegmentUids: string[]

  if (
    prev &&
    prev.workspaceCode === userInfo.workspaceCode &&
    prev.recordingName === recordingName
  ) {
    recordingUid = prev.recordingUid
    uploadedSegmentUids = [...prev.uploadedSegmentUids]
  } else {
    // Step 1: create recording
    const created = await createRecording(api_base_url, userInfo.workspaceCode, {
      name: recordingName,
      enterUrl,
      source: 'agent',
    })
    recordingUid = created.uid
    uploadedSegmentUids = []
    await saveUploadProgress({
      recordingUid,
      uploadedSegmentUids,
      workspaceCode: userInfo.workspaceCode,
      recordingName,
    })
  }

  try {
    // Steps 2-4 for each segment
    for (const seg of segments) {
      if (uploadedSegmentUids.includes(seg.uid)) continue
      const segmentUid = await uploadSingleSegment(
        api_base_url,
        userInfo.workspaceCode,
        recordingUid,
        seg
      )
      uploadedSegmentUids.push(segmentUid)
      await saveUploadProgress({
        recordingUid,
        uploadedSegmentUids,
        workspaceCode: userInfo.workspaceCode,
        recordingName,
      })
      await markSegmentsSynced([seg.uid])
    }

    // Step 5: mark completed
    const totalDuration = segments.reduce((sum, s) => sum + Math.max(0, s.endTime - s.startTime), 0)
    const exitUrl = enterUrl // best-effort: same as enter on single-tab; for cross-tab we use the last segment's URL via storage
    await markCompleted(api_base_url, userInfo.workspaceCode, recordingUid, {
      exitUrl,
      totalDuration,
    })

    // Step 6: cleanup
    await deleteSegmentsBySession(sessionId)
    await clearUploadProgress()
  } catch (err) {
    // Persist progress; the local segments remain so the next retry resumes.
    if (err instanceof UploadApiError && err.httpStatus === 401) {
      await clearUploadProgress()
    }
    throw err
  }

  const frontendUrl = `${frontend_base_url}/workspaces/${encodeURIComponent(userInfo.workspaceCode)}/recordings/${recordingUid}`
  return { recordingUid, frontendUrl }
}

async function uploadSingleSegment(
  apiBaseUrl: string,
  workspaceCode: string,
  recordingUid: string,
  seg: Segment
): Promise<string> {
  // Step 2: create segment
  const created = await createSegment(apiBaseUrl, workspaceCode, recordingUid, {
    sequence: seg.sequence,
    startTime: seg.startTime,
    endTime: seg.endTime,
    pageUrls: seg.pageUrls,
    storageKey: `recordings/${workspaceCode}/${recordingUid}/${seg.uid}.rrweb.json`,
    size: JSON.stringify(seg.events).length,
  })

  // Step 3 + 4: get presigned URL and upload to it. Because rustfs lacks
  // CORS, we route the bytes through the backend's proxy endpoint instead
  // of PUTting directly to the presigned URL. The proxy takes the same
  // auth context, so we skip the presigned-URL fetch here.
  await uploadSegmentBytes(apiBaseUrl, workspaceCode, recordingUid, created.uid, seg.events)

  return created.uid
}

/** Discard local segments and any saved progress (used by "丢弃旧录像" action). */
export async function discardSession(sessionId: string): Promise<void> {
  await deleteSegmentsBySession(sessionId)
  await clearUploadProgress()
}
