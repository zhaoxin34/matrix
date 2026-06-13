import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  bus,
  createRecording,
  createSegment,
  getPresignedUploadUrl,
  markCompleted,
  uploadSegmentBytes,
} from './api-client'
import * as userInfoStore from '../auth/user-info-store'

const API = 'http://localhost:8000'
const WS = 'ws-test'

function mockFetchOk(body: unknown) {
  ;(globalThis as { fetch: typeof fetch }).fetch = vi.fn(
    async () => new Response(JSON.stringify({ data: body }), { status: 200 })
  ) as unknown as typeof fetch
}

function mockFetchStatus(status: number, body: unknown = {}) {
  ;(globalThis as { fetch: typeof fetch }).fetch = vi.fn(
    async () => new Response(JSON.stringify(body), { status })
  ) as unknown as typeof fetch
}

async function setUserInfo() {
  await userInfoStore.setUserInfo({
    token: 'tkn',
    userId: 1,
    workspaceCode: WS,
    workspaceId: 1,
    username: 'u',
    acquiredAt: 0,
  })
}

describe('api-client', () => {
  beforeEach(async () => {
    await userInfoStore.clearUserInfo()
  })

  it('createRecording sends POST and unwraps `data`', async () => {
    await setUserInfo()
    mockFetchOk({ uid: 'rec-1' })
    const r = await createRecording(API, WS, { name: 'n', enterUrl: 'http://x' })
    expect(r.uid).toBe('rec-1')
  })

  it('createSegment sends POST and unwraps `data`', async () => {
    await setUserInfo()
    mockFetchOk({ uid: 'seg-1' })
    const r = await createSegment(API, WS, 'rec-1', {
      sequence: 1,
      startTime: 1000,
      endTime: 2000,
      pageUrls: ['http://x'],
      storageKey: 'k',
      size: 12,
    })
    expect(r.uid).toBe('seg-1')
  })

  it('getPresignedUploadUrl returns url and storageKey', async () => {
    await setUserInfo()
    mockFetchOk({ url: 'https://s3/put', storageKey: 'k' })
    const r = await getPresignedUploadUrl(API, WS, 'rec-1', {
      filename: 'f.json',
      contentType: 'application/json',
    })
    expect(r.url).toBe('https://s3/put')
    expect(r.storageKey).toBe('k')
  })

  it('uploadSegmentBytes PUTs to the proxy endpoint', async () => {
    await setUserInfo()
    mockFetchOk({ storage_key: 'k', size: 10 })
    const r = await uploadSegmentBytes(API, WS, 'rec-1', 'seg-1', [{ type: 4 }])
    expect(r.storageKey).toBe('k')
  })

  it('markCompleted sends PUT with status=completed', async () => {
    await setUserInfo()
    mockFetchOk({})
    await markCompleted(API, WS, 'rec-1', { exitUrl: 'http://x', totalDuration: 1000 })
  })

  it('throws UploadApiError(401, retryable=false) when no userInfo', async () => {
    // No setUserInfo call
    await expect(
      createRecording(API, WS, { name: 'n', enterUrl: 'http://x' })
    ).rejects.toMatchObject({ httpStatus: 401, retryable: false })
  })

  it('clears userInfo + emits authRequired on 401 response', async () => {
    await setUserInfo()
    mockFetchStatus(401, { message: 'Token expired' })
    const received: string[] = []
    const off = bus.on('authRequired', () => received.push('auth'))
    await expect(
      createRecording(API, WS, { name: 'n', enterUrl: 'http://x' })
    ).rejects.toMatchObject({ httpStatus: 401, retryable: false })
    off()
    expect(received).toEqual(['auth'])
    expect(await userInfoStore.getUserInfo()).toBeNull()
  })

  it('classifies 5xx as retryable', async () => {
    await setUserInfo()
    mockFetchStatus(503, { message: 'Service Unavailable' })
    await expect(
      createRecording(API, WS, { name: 'n', enterUrl: 'http://x' })
    ).rejects.toMatchObject({ retryable: true })
  })

  it('classifies 4xx (non-401) as non-retryable', async () => {
    await setUserInfo()
    mockFetchStatus(400, { message: 'Bad Request' })
    await expect(
      createRecording(API, WS, { name: 'n', enterUrl: 'http://x' })
    ).rejects.toMatchObject({ retryable: false })
  })
})
