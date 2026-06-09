/**
 * Extension Configuration
 * Popup 管理的配置项，存储在 chrome.storage.local
 */
export interface ExtensionConfig {
  /** Neo 前端地址 */
  frontendUrl: string
  /** Neo 后端地址 */
  backendUrl: string
  /** 是否启用遮罩层 */
  enableOverlay: boolean
  /** 是否启用录制 */
  enableRecording: boolean
  /** 用户认证 token */
  token?: string
}

/** 默认配置 */
export const DEFAULT_CONFIG: ExtensionConfig = {
  frontendUrl: 'http://localhost:3300',
  backendUrl: 'http://localhost:8000',
  enableOverlay: true,
  enableRecording: true,
  token: '',
}

/** 配置存储的 key */
export const CONFIG_STORAGE_KEY = 'extension-config'

/** 消息类型 */
export enum MessageType {
  CONFIG_UPDATED = 'CONFIG_UPDATED',
}

/** 消息接口 */
export interface ConfigUpdatedMessage {
  type: MessageType.CONFIG_UPDATED
  payload: Partial<ExtensionConfig>
}
