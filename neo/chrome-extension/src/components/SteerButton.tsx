/**
 * SteerButton - Neo Agent Floating Action Button
 * 使用内联样式确保在 Shadow DOM 中正常工作
 */
import { useState, useEffect, useRef } from 'react'

// Agent 模式
export type AgentMode = 'idle' | 'learn' | 'guide' | 'active'

// 模式信息
const MODE_INFO = {
  learn: { label: '学习模式', desc: '录制用户操作' },
  guide: { label: '指导模式', desc: '回放引导操作' },
  active: { label: '主动模式', desc: 'AI 自动执行' },
} as const

// 全局样式（注入到 Shadow DOM）
const GLOBAL_STYLES = `
@property --glow-hue {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes glow-rotate {
  from { --glow-hue: 0deg; }
  to { --glow-hue: 360deg; }
}

@keyframes recording-pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 0.4; }
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.steer-fab-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.steer-fab {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: linear-gradient(145deg, #1a1a2e, #16213e);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.3);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  overflow: visible;
}

.steer-fab::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  padding: 3px;
  background: conic-gradient(
    from var(--glow-hue),
    #6366f1 0deg, #8b5cf6 60deg, #ec4899 120deg,
    #f97316 180deg, #22c55e 240deg, #06b6d4 300deg, #6366f1 360deg
  );
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  opacity: 0.7;
  animation: glow-rotate 3s linear infinite;
  pointer-events: none;
}

.steer-fab::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: linear-gradient(145deg, #1a1a2e, #16213e);
  z-index: -1;
}

.steer-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.5), 0 0 35px rgba(99, 102, 241, 0.5);
}

.steer-fab-icon {
  width: 24px;
  height: 24px;
  color: #e0e7ff;
}

.mode-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #1a1a2e;
}
.mode-indicator.learn { background: linear-gradient(135deg, #22c55e, #16a34a); }
.mode-indicator.guide { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.mode-indicator.active { background: linear-gradient(135deg, #f97316, #ea580c); }

.steer-dropdown {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 200px;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(99, 102, 241, 0.3);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.2);
  padding: 8px;
  opacity: 0;
  transform: translateY(10px) scale(0.95);
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.steer-dropdown.open {
  opacity: 1;
  transform: translateY(0) scale(1);
  visibility: visible;
}

.steer-dropdown-header {
  padding: 8px 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}

.steer-dropdown-title {
  font-size: 13px;
  font-weight: 600;
  color: #e0e7ff;
  margin: 0;
}

.steer-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #a1a1aa;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.steer-menu-item:hover {
  background: rgba(99, 102, 241, 0.15);
  color: #ffffff;
}

.steer-menu-item.selected {
  background: rgba(99, 102, 241, 0.25);
  color: #818cf8;
}

.menu-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
.menu-icon.learn { color: #22c55e; }
.menu-icon.guide { color: #3b82f6; }
.menu-icon.active { color: #f97316; }

.menu-text { flex: 1; }
.menu-label { display: block; font-weight: 500; }
.menu-desc { display: block; font-size: 11px; opacity: 0.7; margin-top: 2px; }

.steer-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin-top: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6366f1;
}
.status-dot.recording {
  background: #ef4444;
  animation: recording-pulse 1s ease-in-out infinite;
}

.status-text {
  font-size: 12px;
  color: #a1a1aa;
}

.dropdown-arrow {
  position: absolute;
  bottom: -6px;
  right: 20px;
  width: 12px;
  height: 12px;
  background: rgba(26, 26, 46, 0.95);
  border-right: 1px solid rgba(99, 102, 241, 0.3);
  border-bottom: 1px solid rgba(99, 102, 241, 0.3);
  transform: rotate(45deg);
}
`

interface SteerButtonProps {
  mode?: AgentMode
  isRecording?: boolean
  recordingDuration?: string
  onModeChange?: (mode: AgentMode) => void
  onClick?: () => void
}

// Icons
const SteerIcon = () => (
  <svg
    className="steer-fab-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
)

const LearnIcon = ({ className }: { className?: string }) => (
  <svg
    className={`menu-icon learn ${className || ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6M8 10l4-4 4 4" />
  </svg>
)

const GuideIcon = ({ className }: { className?: string }) => (
  <svg
    className={`menu-icon guide ${className || ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
  </svg>
)

const ActiveIcon = ({ className }: { className?: string }) => (
  <svg
    className={`menu-icon active ${className || ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
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
  const containerRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)

  // 注入全局样式
  useEffect(() => {
    if (!containerRef.current) return

    // 获取 Shadow Root
    const shadow =
      containerRef.current.shadowRoot || containerRef.current.attachShadow({ mode: 'open' })

    // 避免重复注入样式
    if (!shadow.querySelector('style[data-steer]')) {
      const style = document.createElement('style')
      style.setAttribute('data-steer', 'true')
      style.textContent = GLOBAL_STYLES
      shadow.appendChild(style)
      styleRef.current = style
    }
  }, [])

  // 同步外部模式
  useEffect(() => {
    setSelectedMode(mode)
  }, [mode])

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
    <div ref={containerRef} className="steer-fab-container">
      <div className={`steer-dropdown ${isOpen ? 'open' : ''}`}>
        <div className="steer-dropdown-header">
          <h3 className="steer-dropdown-title">Neo Agent 控制台</h3>
        </div>

        <button
          className={`steer-menu-item ${selectedMode === 'learn' ? 'selected' : ''}`}
          onClick={() => handleModeSelect('learn')}
        >
          <LearnIcon />
          <div className="menu-text">
            <span className="menu-label">{MODE_INFO.learn.label}</span>
            <span className="menu-desc">{MODE_INFO.learn.desc}</span>
          </div>
        </button>

        <button
          className={`steer-menu-item ${selectedMode === 'guide' ? 'selected' : ''}`}
          onClick={() => handleModeSelect('guide')}
        >
          <GuideIcon />
          <div className="menu-text">
            <span className="menu-label">{MODE_INFO.guide.label}</span>
            <span className="menu-desc">{MODE_INFO.guide.desc}</span>
          </div>
        </button>

        <button
          className={`steer-menu-item ${selectedMode === 'active' ? 'selected' : ''}`}
          onClick={() => handleModeSelect('active')}
        >
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
