import { describe, it, expect, beforeEach } from 'vitest'

import {
  assertValidMessage,
  isRecordingCommand,
  isRecordingEvent,
  makeCommand,
  makeEvent,
  _resetMessageCounter,
  PROTOCOL_VERSION,
  type RecordingCommand,
  type RecordingEvent,
} from './protocol'

describe('message factories', () => {
  beforeEach(() => _resetMessageCounter())

  it('makeCommand fills version, direction, timestamp, messageId', () => {
    const msg = makeCommand('recording.start', { sessionId: 'abc' })
    expect(msg.version).toBe(PROTOCOL_VERSION)
    expect(msg.direction).toBe('command')
    expect(msg.timestamp).toBeGreaterThan(0)
    expect(msg.messageId).toMatch(/^cmd_/)
    expect(msg.type).toBe('recording.start')
    expect(msg.payload.sessionId).toBe('abc')
  })

  it('makeEvent fills version, direction, timestamp, messageId', () => {
    const msg = makeEvent('recording.state', {
      isRecording: true,
      isPaused: false,
      duration: 0,
      segmentCount: 1,
      eventCount: 0,
      sessionId: 'x',
      isActiveRecorder: true,
    })
    expect(msg.version).toBe(PROTOCOL_VERSION)
    expect(msg.direction).toBe('event')
    expect(msg.messageId).toMatch(/^evt_/)
  })

  it('messageId is monotonically increasing per process', () => {
    const a = makeCommand('recording.pause', {})
    const b = makeCommand('recording.pause', {})
    expect(a.messageId).not.toBe(b.messageId)
  })
})

describe('isRecordingCommand', () => {
  it('accepts a valid command', () => {
    const m: RecordingCommand = makeCommand('recording.start', { sessionId: 's' })
    expect(isRecordingCommand(m)).toBe(true)
  })

  it('rejects events', () => {
    const m: RecordingEvent = makeEvent('recording.state', {
      isRecording: false,
      isPaused: true,
      duration: 0,
      segmentCount: 0,
      eventCount: 0,
      sessionId: 's',
      isActiveRecorder: false,
    })
    expect(isRecordingCommand(m)).toBe(false)
  })

  it('rejects unknown types', () => {
    const fake = {
      type: 'recording.bogus',
      version: 1,
      direction: 'command',
      timestamp: 0,
      messageId: 'x',
      payload: {},
    }
    expect(isRecordingCommand(fake)).toBe(false)
  })

  it('rejects malformed input', () => {
    expect(isRecordingCommand(null)).toBe(false)
    expect(isRecordingCommand({})).toBe(false)
    expect(isRecordingCommand({ type: 'recording.start' })).toBe(false)
  })
})

describe('isRecordingEvent', () => {
  it('accepts a valid event', () => {
    const m = makeEvent('recording.data', {
      segments: [{ uid: 's', startTime: 0, endTime: 1, duration: 1, eventCount: 1, pageUrls: [] }],
    })
    expect(isRecordingEvent(m)).toBe(true)
  })

  it('rejects commands', () => {
    const m = makeCommand('recording.fetch', {})
    expect(isRecordingEvent(m)).toBe(false)
  })
})

describe('assertValidMessage', () => {
  it('does not throw on valid command', () => {
    const m = makeCommand('recording.start', { sessionId: 's' })
    expect(() => assertValidMessage(m)).not.toThrow()
  })

  it('throws on unknown type', () => {
    expect(() =>
      assertValidMessage({
        type: 'weird',
        version: 1,
        direction: 'command',
        timestamp: 0,
        messageId: 'x',
        payload: {},
      })
    ).toThrow()
  })

  it('throws on missing fields', () => {
    expect(() => assertValidMessage({ type: 'recording.start' })).toThrow()
    expect(() => assertValidMessage(null)).toThrow()
  })
})
