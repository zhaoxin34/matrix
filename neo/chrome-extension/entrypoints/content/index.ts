/**
 * Content Script - Neo Agent Chrome Extension
 *
 * 负责在目标页面注入浮动按钮和管理用户操作
 */
import { createShadowRootUi } from '#imports'
import ReactDOM from 'react-dom/client'
import React from 'react'
import { SteerButton, type AgentMode } from '../../src/components'

// 当前状态
let currentMode: AgentMode = 'idle'
let isRecording = false
let recordingStartTime: number | null = null

// 获取录制时长
function getRecordingDuration(): string {
  if (!recordingStartTime) return '00:00:00'
  const elapsed = Date.now() - recordingStartTime
  const hours = Math.floor(elapsed / 3600000)
  const minutes = Math.floor((elapsed % 3600000) / 60000)
  const seconds = Math.floor((elapsed % 60000) / 1000)
  return [hours, minutes, seconds].map(v => v.toString().padStart(2, '0')).join(':')
}

// 定时更新录制时长
let durationInterval: ReturnType<typeof setInterval> | null = null
let updateCallback: (() => void) | null = null

function startDurationTimer() {
  if (durationInterval) clearInterval(durationInterval)
  durationInterval = setInterval(() => {
    updateCallback?.()
  }, 1000)
}

function stopDurationTimer() {
  if (durationInterval) {
    clearInterval(durationInterval)
    durationInterval = null
  }
}

// 模式变更处理
function handleModeChange(mode: AgentMode) {
  console.log('[Neo Agent] Mode changed:', mode)
  currentMode = mode

  // 如果切换到学习模式，自动开始录制
  if (mode === 'learn' && !isRecording) {
    startRecording()
  } else if (mode !== 'learn' && isRecording) {
    stopRecording()
  }

  // 通知 iframe
  window.postMessage(
    {
      type: 'NEO_MODE_CHANGED',
      payload: { mode },
    },
    '*'
  )
}

// 按钮点击处理
function handleButtonClick() {
  console.log('[Neo Agent] Button clicked')
}

// 开始录制
function startRecording() {
  console.log('[Neo Agent] Start recording')
  isRecording = true
  recordingStartTime = Date.now()
  startDurationTimer()
  updateCallback?.()

  window.postMessage(
    {
      type: 'NEO_RECORDING_STARTED',
      payload: {},
    },
    '*'
  )
}

// 停止录制
function stopRecording() {
  console.log('[Neo Agent] Stop recording')
  isRecording = false
  stopDurationTimer()
  recordingStartTime = null
  updateCallback?.()

  window.postMessage(
    {
      type: 'NEO_RECORDING_STOPPED',
      payload: {},
    },
    '*'
  )
}

// 监听来自 iframe 的消息
window.addEventListener('message', event => {
  if (event.source !== window) return

  const { type, payload } = event.data || {}

  switch (type) {
    case 'NEO_START_RECORDING':
      startRecording()
      break
    case 'NEO_STOP_RECORDING':
      stopRecording()
      break
    case 'NEO_SET_MODE':
      if (payload?.mode) {
        currentMode = payload.mode
        updateCallback?.()
      }
      break
  }
})

export default defineContentScript({
  matches: ['<all_urls>'], // 匹配所有页面
  cssInjectionMode: 'manual',

  async main(ctx) {
    // 创建 Shadow DOM UI
    const ui = await createShadowRootUi(ctx, {
      name: 'neo-steer-button',
      position: 'inline',
      anchor: 'body',
      append: 'first',
      onMount: container => {
        // 创建 wrapper
        const wrapper = document.createElement('div')
        wrapper.id = 'neo-steer-container'
        container.appendChild(wrapper)

        // 创建 React Root
        const root = ReactDOM.createRoot(wrapper)

        // 更新回调
        updateCallback = () => {
          root.render(
            React.createElement(SteerButton, {
              mode: currentMode,
              isRecording,
              recordingDuration: getRecordingDuration(),
              onModeChange: handleModeChange,
              onClick: handleButtonClick,
            })
          )
        }

        // 初始渲染
        updateCallback()

        console.log('[Neo Agent] SteerButton mounted')

        return { root, wrapper }
      },
      onRemove: elements => {
        elements?.root?.unmount()
        elements?.wrapper?.remove()
        stopDurationTimer()
      },
    })

    ui.mount()
  },
})
