/**
 * Verify the popup works in a real Chrome extension context.
 *
 * Launches Chrome with the .output/chrome-mv3 directory loaded as an
 * unpacked extension, then opens a page and captures the popup state
 * via the extension's content script (or via direct evaluation of
 * popup.html in the extension origin).
 *
 * Approach: launch persistent context with --load-extension, navigate
 * to popup.html via the extension's chrome-extension://[id] origin,
 * capture DOM + console.
 */

import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readdir } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const extDir = resolve(__dirname, '..', '.output', 'chrome-mv3')

async function main() {
  // Find the extension id by reading manifest.json's computed path.
  // Playwright's --load-extension needs an absolute path.
  const extFiles = await readdir(extDir)
  console.log('Extension dir contents:', extFiles.filter(f => !f.startsWith('.')).slice(0, 20))

  // Use a per-run user data dir so we don't clobber the user's profile.
  const userDataDir = '/tmp/playwright-agent-steer-test'
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // need a real Chrome UI to host the extension
    args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`],
  })

  // Wait for the extension to load; check service workers
  const workers = context.serviceWorkers()
  console.log(`Service workers registered: ${workers.length}`)
  for (const w of workers) {
    console.log(`  - ${w.url()}`)
  }

  // The popup.html is a static file inside the extension, not a page
  // you can navigate to. We need to open a regular page first, then
  // the user clicks the extension button. In headless mode we can
  // directly access the extension page via the extension's URL.
  const extId = workers[0]?.url().match(/chrome-extension:\/\/([a-z]+)/)?.[1]
  console.log('Extension id:', extId)
  if (!extId) {
    console.log('Could not determine extension id. Open chrome://extensions and check.')
    await context.close()
    process.exit(1)
  }

  // Open popup.html directly (this is what Chrome does when the user
  // clicks the extension icon).
  const popupUrl = `chrome-extension://${extId}/popup.html`
  const page = await context.newPage()

  const consoleMsgs = []
  const pageErrors = []
  const failedRequests = []
  page.on('console', m => consoleMsgs.push(`[${m.type()}] ${m.text()}`))
  page.on('pageerror', e => pageErrors.push(`${e.name}: ${e.message}`))
  page.on('requestfailed', req => {
    failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`)
  })

  console.log('\nNavigating to popup:', popupUrl)
  await page.goto(popupUrl)
  await page.waitForTimeout(2_500)

  const inspect = await page.evaluate(() => {
    const root = document.getElementById('root')
    return {
      bodyWidth: document.body.offsetWidth,
      bodyHeight: document.body.offsetHeight,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      rootChildren: root ? root.children.length : 0,
      rootText: root ? root.textContent?.trim().slice(0, 300) : null,
      rootHTML: root ? root.innerHTML.slice(0, 500) : null,
    }
  })

  console.log('\n=== Body ===')
  console.log(`  ${inspect.bodyWidth} × ${inspect.bodyHeight}, bg=${inspect.bodyBg}`)
  console.log('\n=== Root ===')
  console.log(`  children=${inspect.rootChildren}`)
  console.log(`  text: "${inspect.rootText}"`)
  console.log(`  HTML: ${inspect.rootHTML}`)

  console.log('\n=== Failed requests ===')
  for (const r of failedRequests) console.log('  ' + r)

  console.log('\n=== Page errors ===')
  for (const e of pageErrors) console.log('  ' + e)

  console.log('\n=== Console ===')
  for (const m of consoleMsgs) console.log('  ' + m)

  await page.screenshot({ path: 'scripts/popup-extension-smoke.png', fullPage: true })
  console.log('\n📸 Screenshot: scripts/popup-extension-smoke.png')

  await context.close()
  process.exit(inspect.rootChildren > 0 ? 0 : 1)
}

main().catch(e => {
  console.error(e)
  process.exit(2)
})
