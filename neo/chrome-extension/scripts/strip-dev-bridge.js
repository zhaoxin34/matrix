/**
 * Post-build: strip the WXT dev-mode WebSocket bridge from background.js.
 *
 * WXT 0.20.26 has a bug where the dev server WebSocket bridge (the
 * `getDevServerWebSocket` / `wxt:reload-content-script` listener) is
 * bundled into PRODUCTION background.js. This causes Chrome to throw
 * `Could not load file '...content.js' for content script. It isn't
 * UTF-8 encoded` when the dev bridge tries to hot-reload the content
 * script via `chrome.scripting.updateContentScripts()`.
 *
 * We strip the offending block from the production background.js. The
 * resulting file is a no-op background that only runs the user code.
 *
 * Run via: node scripts/strip-dev-bridge.js
 * Wired into `pnpm build` as a postbuild step.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const bgPath = join(__dirname, '..', '.output', 'chrome-mv3', 'background.js')

// We strip the entire `try { ... } catch (err) { logger.error(...) }` block
// that contains the dev WebSocket setup, plus the `keepServiceWorkerAlive`
// call (which polls every 5s and is meant for dev only).
//
// The block starts with `try {` followed by `const ws = getDevServerWebSocket();`
// and ends with the matching `}` followed by `} catch (err) { logger.error("Failed
// to setup web socket connection with dev server", err); }`.
//
// Strategy: use a regex to find the dev block and replace it with a no-op.

let content
try {
  content = await readFile(bgPath, 'utf8')
} catch (err) {
  console.error('Could not read background.js:', err)
  process.exit(1)
}

const before = content

// Pattern matches the entire try-catch block. The block always starts with
// `try {\n        const ws = getDevServerWebSocket();` and ends with the
// matching `} catch (err) {` ... `logger.error("Failed to setup web socket
// connection with dev server", err);`.
const patterns = [
  // The full try-catch block.
  /try\s*\{\s*const\s+ws\s*=\s*getDevServerWebSocket\(\);[\s\S]*?Failed to setup web socket connection with dev server[\s\S]*?\}\s*catch[\s\S]*?\}\s*/,
  // The keepServiceWorkerAlive call (also dev-only polling).
  /keepServiceWorkerAlive\(\);?/g,
  // The browser.commands.onCommand listener for `wxt:reload-extension`.
  /browser\.commands\.onCommand\.addListener\([\s\S]*?\}\);?/g,
]

for (const re of patterns) {
  content = content.replace(re, '')
}

if (content === before) {
  console.log('• No dev bridge found in background.js (already clean)')
} else {
  await writeFile(bgPath, content, 'utf8')
  const savedBytes = before.length - content.length
  console.log(`✓ Stripped dev bridge from background.js (saved ${savedBytes} bytes)`)
}
