/**
 * AgentMessage protocol — type definitions, factory functions, and type guards.
 *
 * See openspec/changes/agent-steer-recording/design.md §3 for the wire format.
 */

export const PROTOCOL_VERSION = 1
export const NAMESPACE = 'agentSteer'

/* ============================================================
 * Command types (popup → content script)
 * ============================================================ */

export type RecordingCommand =
  | {
      type: 'recording.start'
      version: 1
      direction: 'command'
      timestamp: number
      messageId: string
      payload: { sessionId: string }
    }
  | {
      type: 'recording.pause'
      version: 1
      direction: 'command'
      timestamp: number
      messageId: string
      payload: Record<string, never>
    }
  | {
      type: 'recording.resume'
      version: 1
      direction: 'command'
      timestamp: number
      messageId: string
      payload: Record<string, never>
    }
  | {
      type: 'recording.stop'
      version: 1
      direction: 'command'
      timestamp: number
      messageId: string
      payload: Record<string, never>
    }
  | {
      type: 'recording.fetch'
      version: 1
      direction: 'command'
      timestamp: number
      messageId: string
      payload: Record<string, never>
    }

export type RecordingCommandType = RecordingCommand['type']

/* ============================================================
 * Event types (content script → popup)
 * ============================================================ */

export type RecordingEvent =
  | {
      type: 'recording.state'
      version: 1
      direction: 'event'
      timestamp: number
      messageId: string
      payload: {
        isRecording: boolean
        isPaused: boolean
        /** ms */
        duration: number
        segmentCount: number
        eventCount: number
        sessionId: string
        isActiveRecorder: boolean
        error?: string
      }
    }
  | {
      type: 'recording.data'
      version: 1
      direction: 'event'
      timestamp: number
      messageId: string
      payload: {
        segments: Array<{
          uid: string
          startTime: number
          endTime: number
          duration: number
          eventCount: number
          pageUrls: string[]
        }>
      }
    }

export type RecordingEventType = RecordingEvent['type']

export type RecordingStateEvent = Extract<RecordingEvent, { type: 'recording.state' }>
export type RecordingDataEvent = Extract<RecordingEvent, { type: 'recording.data' }>

export type AnyMessage = RecordingCommand | RecordingEvent

/* ============================================================
 * Cross-tab coordinator messages (background ↔ content script)
 * ============================================================ */

export type CoordinatorMessage =
  | { type: 'tab.flushAndStop'; tabId: number; reason: 'tab_hidden' | 'tab_replaced' }
  | { type: 'tab.becomeRecorder'; tabId: number; sessionId: string }
  | { type: 'tab.demoteRecorder'; tabId: number }

/* ============================================================
 * Error codes for state event `error` field
 * ============================================================ */

export const ERROR_CODES = {
  NO_ACTIVE_TAB: 'NO_ACTIVE_TAB',
  ALREADY_RECORDING: 'ALREADY_RECORDING',
  NOT_RECORDING: 'NOT_RECORDING',
  STORAGE_FULL: 'STORAGE_FULL',
  INTERNAL: 'INTERNAL',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/* ============================================================
 * Factory functions
 * ============================================================ */

let messageCounter = 0

function newMessageId(prefix: string): string {
  messageCounter += 1
  return `${prefix}_${Date.now()}_${messageCounter}`
}

export function makeCommand<T extends RecordingCommandType>(
  type: T,
  payload: Extract<RecordingCommand, { type: T }>['payload']
): Extract<RecordingCommand, { type: T }> {
  return {
    type,
    version: PROTOCOL_VERSION,
    direction: 'command',
    timestamp: Date.now(),
    messageId: newMessageId('cmd'),
    payload,
  } as Extract<RecordingCommand, { type: T }>
}

export function makeEvent<T extends RecordingEventType>(
  type: T,
  payload: Extract<RecordingEvent, { type: T }>['payload']
): Extract<RecordingEvent, { type: T }> {
  return {
    type,
    version: PROTOCOL_VERSION,
    direction: 'event',
    timestamp: Date.now(),
    messageId: newMessageId('evt'),
    payload,
  } as Extract<RecordingEvent, { type: T }>
}

/** Reset the messageId counter (test helper). */
export function _resetMessageCounter(): void {
  messageCounter = 0
}

/* ============================================================
 * Type guards and validators
 * ============================================================ */

const KNOWN_COMMAND_TYPES: ReadonlySet<string> = new Set<RecordingCommandType>([
  'recording.start',
  'recording.pause',
  'recording.resume',
  'recording.stop',
  'recording.fetch',
])

const KNOWN_EVENT_TYPES: ReadonlySet<string> = new Set<RecordingEventType>([
  'recording.state',
  'recording.data',
])

export function isRecordingCommand(msg: unknown): msg is RecordingCommand {
  if (!isAgentMessageShape(msg)) return false
  if (msg.direction !== 'command') return false
  return KNOWN_COMMAND_TYPES.has(msg.type)
}

export function isRecordingEvent(msg: unknown): msg is RecordingEvent {
  if (!isAgentMessageShape(msg)) return false
  if (msg.direction !== 'event') return false
  return KNOWN_EVENT_TYPES.has(msg.type)
}

function isAgentMessageShape(msg: unknown): msg is {
  type: string
  version: number
  direction: string
  timestamp: number
  messageId: string
  payload: unknown
} {
  if (typeof msg !== 'object' || msg === null) return false
  const m = msg as Record<string, unknown>
  return (
    typeof m.type === 'string' &&
    typeof m.version === 'number' &&
    typeof m.direction === 'string' &&
    typeof m.timestamp === 'number' &&
    typeof m.messageId === 'string' &&
    'payload' in m
  )
}

/** Throws a descriptive error if the message is malformed. */
export function assertValidMessage(msg: unknown): asserts msg is AnyMessage {
  if (!isAgentMessageShape(msg)) {
    throw new Error('Invalid AgentMessage: missing required fields')
  }
  if (!KNOWN_COMMAND_TYPES.has(msg.type) && !KNOWN_EVENT_TYPES.has(msg.type)) {
    throw new Error(`Invalid AgentMessage: unknown type '${msg.type}'`)
  }
}
