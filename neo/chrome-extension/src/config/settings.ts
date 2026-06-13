/**
 * Configuration Reader
 *
 * 从 chrome.storage.local 读取 AgentSteerConfig，并对缺失字段应用默认值。
 * 缺失必要字段时返回 discriminated union，调用方应处理 ok: false 情况。
 */

import { DEFAULT_USER_INFO_PATH, type AgentSteerConfig, type GetConfigResult } from './types'

const STORAGE_KEY = 'agent_steer_config'

interface RawConfig {
  api_base_url?: unknown
  frontend_base_url?: unknown
  user_info_path?: unknown
}

/**
 * 读取并校验配置。
 * - api_base_url 和 frontend_base_url 必填
 * - user_info_path 可选，未配置时使用默认值
 */
export async function getConfig(): Promise<GetConfigResult> {
  const raw = (await chrome.storage.local.get(STORAGE_KEY)) as Record<string, RawConfig | undefined>
  const stored = raw[STORAGE_KEY] ?? {}

  const missing: Array<keyof AgentSteerConfig> = []

  if (typeof stored.api_base_url !== 'string' || stored.api_base_url.length === 0) {
    missing.push('api_base_url')
  }
  if (typeof stored.frontend_base_url !== 'string' || stored.frontend_base_url.length === 0) {
    missing.push('frontend_base_url')
  }

  if (missing.length > 0) {
    return { ok: false, missing }
  }

  const config: AgentSteerConfig = {
    api_base_url: stored.api_base_url as string,
    frontend_base_url: stored.frontend_base_url as string,
    user_info_path:
      typeof stored.user_info_path === 'string' && stored.user_info_path.length > 0
        ? stored.user_info_path
        : DEFAULT_USER_INFO_PATH,
  }

  return { ok: true, config }
}

/** 写入配置（用于配置管理 UI，不在本 change 范围内，但暴露出来供其他模块使用） */
export async function setConfig(config: AgentSteerConfig): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: config })
}
