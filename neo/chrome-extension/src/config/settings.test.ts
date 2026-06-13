import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getConfig, setConfig } from './settings'
import { DEFAULT_USER_INFO_PATH } from './types'

describe('getConfig', () => {
  beforeEach(() => {
    // Reset chrome.storage.local before each test
    ;(chrome.storage.local as any).clear?.()
  })

  it('returns ok when both required fields are present', async () => {
    await chrome.storage.local.set({
      agent_steer_config: {
        api_base_url: 'http://localhost:8000',
        frontend_base_url: 'http://localhost:3000',
      },
    })
    const result = await getConfig()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.api_base_url).toBe('http://localhost:8000')
      expect(result.config.frontend_base_url).toBe('http://localhost:3000')
      expect(result.config.user_info_path).toBe(DEFAULT_USER_INFO_PATH)
    }
  })

  it('uses stored user_info_path when provided', async () => {
    await chrome.storage.local.set({
      agent_steer_config: {
        api_base_url: 'http://api.example.com',
        frontend_base_url: 'https://app.example.com',
        user_info_path: '/custom/user-info',
      },
    })
    const result = await getConfig()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.user_info_path).toBe('/custom/user-info')
    }
  })

  it("returns missing=['api_base_url'] when api_base_url is empty", async () => {
    await chrome.storage.local.set({
      agent_steer_config: {
        api_base_url: '',
        frontend_base_url: 'http://localhost:3000',
      },
    })
    const result = await getConfig()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.missing).toEqual(['api_base_url'])
    }
  })

  it('returns missing list when both required fields are absent', async () => {
    // Storage is empty in this test
    const result = await getConfig()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.missing).toContain('api_base_url')
      expect(result.missing).toContain('frontend_base_url')
    }
  })

  it('returns missing when storage value is wrong type', async () => {
    await chrome.storage.local.set({
      agent_steer_config: {
        api_base_url: 12345, // not a string
        frontend_base_url: 'http://localhost:3000',
      },
    })
    const result = await getConfig()
    expect(result.ok).toBe(false)
  })
})

describe('setConfig', () => {
  it('writes config to chrome.storage.local', async () => {
    await setConfig({
      api_base_url: 'http://api.test',
      frontend_base_url: 'http://frontend.test',
      user_info_path: '/u',
    })
    const result = await getConfig()
    expect(result.ok).toBe(true)
  })
})
