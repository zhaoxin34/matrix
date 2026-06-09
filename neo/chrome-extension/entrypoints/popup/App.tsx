/**
 * Popup 主组件
 * 负责配置管理界面
 */
import { useState, useEffect } from 'react'
import type { ExtensionConfig } from './types'
import { DEFAULT_CONFIG } from './types'
import { loadConfig, saveConfig, notifyConfigUpdated } from './storage'
import './style.css'

// Neo Logo SVG
const NeoIcon = () => (
  <svg className="header-icon" viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

function App() {
  const [config, setConfig] = useState<ExtensionConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string>('')

  // 加载配置
  useEffect(() => {
    loadConfig().then(loadedConfig => {
      setConfig(loadedConfig)
      setLoading(false)
    })
  }, [])

  // 处理输入变化
  const handleChange = (field: keyof ExtensionConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  // 保存配置
  const handleSave = async () => {
    setSaving(true)
    setStatus('保存中...')

    try {
      await saveConfig(config)
      await notifyConfigUpdated(config)
      setStatus('已保存')
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      setStatus('保存失败')
      console.error('Failed to save config:', error)
    } finally {
      setSaving(false)
    }
  }

  // 重置为默认配置
  const handleReset = () => {
    setConfig(DEFAULT_CONFIG)
  }

  if (loading) {
    return (
      <div className="app">
        <div className="status">加载中...</div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <NeoIcon />
        <h1>Neo Agent 配置</h1>
      </div>

      {/* 服务地址配置 */}
      <div className="section">
        <div className="section-title">服务地址</div>

        <div className="form-group">
          <label className="form-label">前端地址</label>
          <input
            type="url"
            className="form-input"
            value={config.frontendUrl}
            onChange={e => handleChange('frontendUrl', e.target.value)}
            placeholder="http://localhost:3300"
          />
          <div className="form-hint">Neo 前端应用地址</div>
        </div>

        <div className="form-group">
          <label className="form-label">后端地址</label>
          <input
            type="url"
            className="form-input"
            value={config.backendUrl}
            onChange={e => handleChange('backendUrl', e.target.value)}
            placeholder="http://localhost:8000"
          />
          <div className="form-hint">Neo 后端 API 地址</div>
        </div>
      </div>

      {/* 认证配置 */}
      <div className="section">
        <div className="section-title">认证</div>

        <div className="form-group">
          <label className="form-label">Token</label>
          <input
            type="password"
            className="form-input"
            value={config.token || ''}
            onChange={e => handleChange('token', e.target.value)}
            placeholder="输入认证 Token"
          />
          <div className="form-hint">用于访问 Neo 后端 API</div>
        </div>
      </div>

      {/* 功能开关 */}
      <div className="section">
        <div className="section-title">功能开关</div>

        <div className="form-group">
          <div className="toggle-group">
            <span className="toggle-label">启用录制</span>
            <div
              className={`toggle ${config.enableRecording ? 'active' : ''}`}
              onClick={() => handleChange('enableRecording', !config.enableRecording)}
              role="switch"
              aria-checked={config.enableRecording}
            />
          </div>
          <div className="form-hint">录制用户在页面上的操作行为</div>
        </div>

        <div className="form-group">
          <div className="toggle-group">
            <span className="toggle-label">启用遮罩</span>
            <div
              className={`toggle ${config.enableOverlay ? 'active' : ''}`}
              onClick={() => handleChange('enableOverlay', !config.enableOverlay)}
              role="switch"
              aria-checked={config.enableOverlay}
            />
          </div>
          <div className="form-hint">在引导模式下显示遮罩高亮</div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="actions">
        <button className="btn btn-secondary" onClick={handleReset}>
          重置
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>

      {/* 状态 */}
      {status && (
        <div className="status">
          <span className="status-dot" />
          {status}
        </div>
      )}

      {/* Footer */}
      <div className="footer">Neo Agent v0.1.0 · Chrome Extension</div>
    </div>
  )
}

export default App
