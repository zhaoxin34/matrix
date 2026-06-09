/**
 * SteerButton - Neo Agent Floating Action Button
 * 
 * 浮动圆形按钮，嵌入目标页面，点击后弹出模式选择菜单
 */
import { useState, useEffect, useRef } from 'react';
import './SteerButton.module.css';

// Agent 模式
export type AgentMode = 'idle' | 'learn' | 'guide' | 'active';

// 模式信息
const MODE_INFO = {
  learn: {
    label: '学习模式',
    desc: '录制用户操作',
    icon: '🎓',
  },
  guide: {
    label: '指导模式', 
    desc: '回放引导操作',
    icon: '🎯',
  },
  active: {
    label: '主动模式',
    desc: 'AI 自动执行',
    icon: '⚡',
  },
} as const;

// Icons
const SteerIcon = () => (
  <svg className="steer-fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const LearnIcon = ({ className }: { className?: string }) => (
  <svg className={`menu-icon learn ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6" />
    <path d="M8 10l4-4 4 4" />
  </svg>
);

const GuideIcon = ({ className }: { className?: string }) => (
  <svg className={`menu-icon guide ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
  </svg>
);

const ActiveIcon = ({ className }: { className?: string }) => (
  <svg className={`menu-icon active ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
  </svg>
);

interface SteerButtonProps {
  /** 当前模式 */
  mode?: AgentMode;
  /** 是否录制中 */
  isRecording?: boolean;
  /** 录制时长 */
  recordingDuration?: string;
  /** 模式变更回调 */
  onModeChange?: (mode: AgentMode) => void;
  /** 点击回调 */
  onClick?: () => void;
}

export function SteerButton({
  mode = 'idle',
  isRecording = false,
  recordingDuration = '00:00:00',
  onModeChange,
  onClick,
}: SteerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<AgentMode>(mode);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 同步外部模式
  useEffect(() => {
    setSelectedMode(mode);
  }, [mode]);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // ESC 关闭菜单
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    onClick?.();
  };

  const handleModeSelect = (newMode: AgentMode) => {
    setSelectedMode(newMode);
    onModeChange?.(newMode);
    setIsOpen(false);
  };

  const getModeIndicatorClass = () => {
    if (selectedMode === 'learn') return 'learn';
    if (selectedMode === 'guide') return 'guide';
    if (selectedMode === 'active') return 'active';
    return '';
  };

  const getStatusText = () => {
    if (isRecording) return `录制中 ${recordingDuration}`;
    if (selectedMode === 'idle') return '空闲';
    return MODE_INFO[selectedMode]?.label || '空闲';
  };

  return (
    <div className="steer-fab-container" ref={containerRef}>
      {/* Dropdown Menu */}
      <div className={`steer-dropdown ${isOpen ? 'open' : ''}`}>
        <div className="steer-dropdown-header">
          <h3 className="steer-dropdown-title">Neo Agent 控制台</h3>
        </div>

        {/* Learn Mode */}
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

        {/* Guide Mode */}
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

        {/* Active Mode */}
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

        {/* Status Badge */}
        <div className="status-badge">
          <span className={`status-dot ${isRecording ? 'recording' : ''}`} />
          <span className="status-text">{getStatusText()}</span>
        </div>

        {/* Arrow */}
        <div className="dropdown-arrow" />
      </div>

      {/* Main FAB */}
      <button
        ref={buttonRef}
        className={`steer-fab ${isRecording ? 'recording' : ''}`}
        onClick={handleToggle}
        aria-label="Neo Agent 控制台"
        title="Neo Agent"
      >
        <SteerIcon />
        
        {/* Mode Indicator */}
        {selectedMode !== 'idle' && (
          <span className={`mode-indicator ${getModeIndicatorClass()}`} />
        )}
      </button>
    </div>
  );
}

export default SteerButton;