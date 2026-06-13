/**
 * Vitest setup: provides a minimal in-memory mock for chrome.* APIs used in
 * the agent-steer-recording extension. This lets us run unit tests without
 * pulling in jsdom + WebExtension polyfills.
 */

interface StorageArea {
  get: (
    keys?: string | string[] | Record<string, unknown> | null
  ) => Promise<Record<string, unknown>>
  set: (items: Record<string, unknown>) => Promise<void>
  remove: (keys: string | string[]) => Promise<void>
  clear: () => Promise<void>
}

function createStorageArea(): StorageArea {
  let store: Record<string, unknown> = {}
  return {
    async get(keys) {
      if (keys == null) return { ...store }
      if (typeof keys === 'string') {
        return keys in store ? { [keys]: store[keys] } : {}
      }
      if (Array.isArray(keys)) {
        const out: Record<string, unknown> = {}
        for (const k of keys) if (k in store) out[k] = store[k]
        return out
      }
      // Object form: provide defaults
      const out: Record<string, unknown> = { ...keys }
      for (const k of Object.keys(keys)) {
        if (k in store) out[k] = store[k]
      }
      return out
    },
    async set(items) {
      store = { ...store, ...items }
    },
    async remove(keys) {
      const list = Array.isArray(keys) ? keys : [keys]
      for (const k of list) delete store[k]
    },
    async clear() {
      store = {}
    },
  }
}

const localArea = createStorageArea()
const sessionArea = createStorageArea()

const runtimeListeners: Array<(msg: unknown, sender: unknown, sendResponse: unknown) => unknown> =
  []

const chromeMock = {
  storage: {
    local: localArea,
    session: sessionArea,
    onChanged: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
  runtime: {
    id: 'test-extension-id',
    sendMessage: async () => undefined,
    onMessage: {
      addListener: (fn: (typeof runtimeListeners)[number]) => runtimeListeners.push(fn),
      removeListener: (fn: (typeof runtimeListeners)[number]) => {
        const i = runtimeListeners.indexOf(fn)
        if (i >= 0) runtimeListeners.splice(i, 1)
      },
    },
  },
  tabs: {
    sendMessage: async () => undefined,
    onActivated: { addListener: () => {}, removeListener: () => {} },
    onRemoved: { addListener: () => {}, removeListener: () => {} },
    query: async () => [],
  },
}

;(globalThis as unknown as { chrome: typeof chromeMock }).chrome = chromeMock
