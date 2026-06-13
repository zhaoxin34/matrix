import { describe, it, expect, beforeEach, vi } from 'vitest'

import { uploadRecording, discardSession, loadUploadProgress } from './service'
import * as segments from '../storage/segments'
import * as userInfoStore from '../auth/user-info-store'
import * as apiClient from './api-client'
import { UploadApiError } from './api-client'

import 'fake-indexeddb/auto'
import { _closeDbForTests, _resetDbForTests } from '../storage/db'

const API = 'http://localhost:8000'
const FE = 'http://localhost:3000'
const WS = 'ws-1'

async function setConfig() {
  await chrome.storage.local.set({
    agent_steer_config: {
      api_base_url: API,
      frontend_base_url: FE,
    },
  })
}

async function setUserInfo() {
  await userInfoStore.setUserInfo({
    token: 'tkn',
    userId: 7,
    workspaceCode: WS,
    workspaceId: 1,
    username: 'u',
    acquiredAt: 0,
  })
}

async function putSegment(uid: string, sequence: number, sessionId = 'sess-1') {
  await segments.putSegment({
    uid,
    sessionId,
    sequence,
    startTime: 1_000_000 + sequence * 1000,
    endTime: 1_000_000 + (sequence + 1) * 1000,
    events: [{ type: 4, data: { href: 'http://x' } }],
    pageUrls: ['http://x'],
  })
}

describe('upload service', () => {
  beforeEach(async () => {
    await _closeDbForTests()
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('neo-agent-recordings')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () => resolve()
    })
    _resetDbForTests()
    await chrome.storage.local.clear()
    await chrome.storage.session.clear()
    // Re-seed AFTER the clear.
    await setConfig()
    await setUserInfo()
  })

  it('runs the 4-step flow on first attempt and clears local data', async () => {
    await putSegment('seg-1', 1)
    await putSegment('seg-2', 2)

    const createRecordingMock = vi
      .spyOn(apiClient, 'createRecording')
      .mockResolvedValue({ uid: 'rec-1' })
    const createSegment = vi
      .spyOn(apiClient, 'createSegment')
      .mockResolvedValue({ uid: 'backend-seg-1' })
    // For the second segment, return a different uid so we can verify the call.
    createSegment.mockResolvedValueOnce({ uid: 'backend-seg-1' })
    createSegment.mockResolvedValueOnce({ uid: 'backend-seg-2' })
    const uploadBytes = vi
      .spyOn(apiClient, 'uploadSegmentBytes')
      .mockResolvedValue({ storageKey: 'k', size: 1 })
    const markDone = vi.spyOn(apiClient, 'markCompleted').mockResolvedValue(undefined)

    const result = await uploadRecording('sess-1', 'My recording', 'http://x/')
    expect(result.recordingUid).toBe('rec-1')
    expect(result.frontendUrl).toContain('/workspaces/ws-1/recordings/rec-1')
    expect(createRecordingMock).toHaveBeenCalledTimes(1)
    expect(createSegment).toHaveBeenCalledTimes(2)
    expect(uploadBytes).toHaveBeenCalledTimes(2)
    expect(markDone).toHaveBeenCalledTimes(1)

    // Local segments cleared
    const remaining = await segments.getSegmentsBySession('sess-1')
    expect(remaining).toHaveLength(0)

    // Progress cleared
    expect(await loadUploadProgress()).toBeNull()
  })

  it('resumes from saved progress on retry (no duplicate recording)', async () => {
    await putSegment('seg-1', 1)
    // Pre-seed progress as if first segment was already uploaded
    await chrome.storage.local.set({
      agent_steer_upload_progress: {
        recordingUid: 'rec-existing',
        uploadedSegmentUids: ['seg-1'],
        workspaceCode: WS,
        recordingName: 'My recording',
      },
    })

    const createRecordingMock = vi
      .spyOn(apiClient, 'createRecording')
      .mockResolvedValue({ uid: 'should-not-be-called' })
    const createSegment = vi
      .spyOn(apiClient, 'createSegment')
      .mockResolvedValue({ uid: 'backend-seg-1' })
    const uploadBytes = vi
      .spyOn(apiClient, 'uploadSegmentBytes')
      .mockResolvedValue({ storageKey: 'k', size: 1 })
    const markDone = vi.spyOn(apiClient, 'markCompleted').mockResolvedValue(undefined)

    await uploadRecording('sess-1', 'My recording', 'http://x/')
    expect(createRecordingMock).not.toHaveBeenCalled()
    // seg-1 was already uploaded; no createSegment call for it. With only 1 segment, none.
    expect(createSegment).not.toHaveBeenCalled()
    expect(uploadBytes).not.toHaveBeenCalled()
    expect(markDone).toHaveBeenCalledWith(
      API,
      WS,
      'rec-existing',
      expect.objectContaining({ exitUrl: 'http://x/' })
    )
  })

  it('preserves local segments on failure so retry is possible', async () => {
    await putSegment('seg-1', 1)
    const createRecordingMock = vi
      .spyOn(apiClient, 'createRecording')
      .mockResolvedValue({ uid: 'rec-1' })
    const createSegment = vi
      .spyOn(apiClient, 'createSegment')
      .mockResolvedValue({ uid: 'backend-seg-1' })
    const uploadBytes = vi
      .spyOn(apiClient, 'uploadSegmentBytes')
      .mockRejectedValue(new UploadApiError(503, 'Service Unavailable', true))
    const markDone = vi.spyOn(apiClient, 'markCompleted').mockResolvedValue(undefined)

    await expect(uploadRecording('sess-1', 'My recording', 'http://x/')).rejects.toMatchObject({
      httpStatus: 503,
      retryable: true,
    })
    // Local segments still present
    const remaining = await segments.getSegmentsBySession('sess-1')
    expect(remaining.length).toBeGreaterThan(0)
    // Progress saved
    const p = await loadUploadProgress()
    expect(p?.recordingUid).toBe('rec-1')

    expect(createRecordingMock).toHaveBeenCalledTimes(1)
    expect(createSegment).toHaveBeenCalledTimes(1)
    expect(uploadBytes).toHaveBeenCalledTimes(1)
    expect(markDone).not.toHaveBeenCalled()
  })

  it('clears progress on 401 (auth cleared, no resume)', async () => {
    await putSegment('seg-1', 1)
    vi.spyOn(apiClient, 'createRecording').mockRejectedValue(
      new UploadApiError(401, 'Token expired', false)
    )
    await expect(uploadRecording('sess-1', 'My recording', 'http://x/')).rejects.toMatchObject({
      httpStatus: 401,
    })
    expect(await loadUploadProgress()).toBeNull()
  })

  it('discardSession removes local segments and clears progress', async () => {
    await putSegment('seg-1', 1)
    await chrome.storage.local.set({
      agent_steer_upload_progress: {
        recordingUid: 'rec-1',
        uploadedSegmentUids: ['seg-1'],
        workspaceCode: WS,
        recordingName: 'x',
      },
    })
    await discardSession('sess-1')
    expect(await segments.getSegmentsBySession('sess-1')).toHaveLength(0)
    expect(await loadUploadProgress()).toBeNull()
  })
})
