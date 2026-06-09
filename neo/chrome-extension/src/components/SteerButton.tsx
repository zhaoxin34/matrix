/**
 * SteerButton - Neo Agent Floating Action Button
 * 样式由 content.ts 注入到 Shadow DOM
 */
import { useState, useEffect } from 'react'

// Agent 模式
export type AgentMode = 'idle' | 'learn' | 'guide' | 'active'

// 模式信息
const MODE_INFO = {
  learn: { label: '学习模式', desc: '录制用户操作' },
  guide: { label: '指导模式', desc: '回放引导操作' },
  active: { label: '主动模式', desc: 'AI 自动执行' },
} as const

interface SteerButtonProps {
  mode?: AgentMode
  isRecording?: boolean
  recordingDuration?: string
  onModeChange?: (mode: AgentMode) => void
  onClick?: () => void
}

// Icons
const SteerIcon = () => (
  <svg className="steer-fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
)

const LearnIcon = ({ className }: { className?: string }) => (
  <svg className={`menu-icon learn ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6M8 10l4-4 4 4" />
  </svg>
)

const GuideIcon = ({ className }: { className?: string }) => (
  <svg className={`menu-icon guide ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
  </svg>
)

const ActiveIcon = ({ className }: { className?: string }) => (
  <svg className={`menu-icon active ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
  </svg>
)

export function SteerButton({
  mode = 'idle',
  isRecording = false,
  recordingDuration = '00:00:00',
  onModeChange,
  onClick,
}: SteerButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMode, setSelectedMode] = useState<AgentMode>(mode)

  // 同步外部模式
  useEffect(() => {
    setSelectedMode(mode)
  }, [mode])

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // @ts-ignore - shadowRoot is available on custom elements
      const root = document.querySelector('#wxt-shadow-host')?.shadowRoot
      if (!root) return
      const container = root.querySelector('.steer-fab-container')
      if (container && !container.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
    onClick?.()
  }

  const handleModeSelect = (newMode: AgentMode) => {
    setSelectedMode(newMode)
    onModeChange?.(newMode)
    setIsOpen(false)
  }

  const getStatusText = () => {
    if (isRecording) return `录制中 ${recordingDuration}`
    if (selectedMode === 'idle') return '空闲'
    return MODE_INFO[selectedMode as keyof typeof MODE_INFO]?.label || '空闲'
  }

  const getIndicatorClass = () => {
    if (selectedMode === 'learn') return 'learn'
    if (selectedMode === 'guide') return 'guide'
    if (selectedMode === 'active') return 'active'
    return ''
  }

  return (
    <div className="steer-fab-container">
      <div className={`steer-dropdown ${isOpen ? 'open' : ''}`}>
        <div className="steer-dropdown-header">
          <h3 className="steer-dropdown-title">Neo Agent 控制台</h3>
        </div>

        <button className={`steer-menu-item ${selectedMode === 'learn' ? 'selected' : ''}`} onClick={() => handleModeSelect('learn')}>
          <LearnIcon />
          <div className="menu-text">
            <span className="menu-label">{MODE_INFO.learn.label}</span>
            <span className="menu-desc">{MODE_INFO.learn.desc}</span>
          </div>
        </button>

        <button className={`steer-menu-item ${selectedMode === 'guide' ? 'selected' : ''}`} onClick={() => handleModeSelect('guide')}>
          <GuideIcon />
          <div className="menu-text">
            <span className="menu-label">{MODE_INFO.guide.label}</span>
            <span className="menu-desc">{MODE_INFO.guide.desc}</span>
          </div>
        </button>

        <button className={`steer-menu-item ${selectedMode === 'active' ? 'selected' : ''}`} onClick={() => handleModeSelect('active')}>
          <ActiveIcon />
          <div className="menu-text">
            <span className="menu-label">{MODE_INFO.active.label}</span>
            <span className="menu-desc">{MODE_INFO.active.desc}</span>
          </div>
        </button>

        <div className="steer-divider" />

        <div className="status-badge">
          <span className={`status-dot ${isRecording ? 'recording' : ''}`} />
          <span className="status-text">{getStatusText()}</span>
        </div>

        <div className="dropdown-arrow" />
      </div>

      <button className="steer-fab" onClick={handleToggle} aria-label="Neo Agent 控制台">
        <SteerIcon />
        {selectedMode !== 'idle' && <span className={`mode-indicator ${getIndicatorClass()}`} />}
      </button>
    </div>
  )
}

export default SteerButton
