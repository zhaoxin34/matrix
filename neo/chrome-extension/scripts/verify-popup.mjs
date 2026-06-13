/**
 * Playwright-based smoke test for the popup.
 *
 * Serves .output/chrome-mv3/ via a tiny HTTP server and loads
 * popup.html. Catches console errors, network failures, and verifies
 * the React app actually mounts (root has children).
 *
 * Why HTTP: file:// origin blocks sub-resource fetches due to Chromium
 * CORS. Real Chrome extensions serve from chrome-extension://, which
 * doesn't have this restriction. A localhost HTTP server approximates
 * the real environment closely enough for smoke testing.
 */

import http from 'node:http'
import { chromium } from 'playwright'
import { resolve, dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile, stat } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '..', '.output', 'chrome-mv3')

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
}

async function serve() {
  return new Promise(resolve => {
    const server = http.createServer(async (req, res) => {
      try {
        let path = req.url?.split('?')[0] ?? '/'
        if (path === '/') path = '/popup.html'
        const filePath = join(outDir, path)
        const s = await stat(filePath)
        if (!s.isFile()) {
          res.writeHead(404)
          res.end('not found')
          return
        }
        const body = await readFile(filePath)
        res.writeHead(200, {
          'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream',
        })
        res.end(body)
      } catch {
        res.writeHead(404)
        res.end('not found')
      }
    })
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port
      resolve({ server, port })
    })
  })
}

async function main() {
  const { server, port } = await serve()
  const url = `http://127.0.0.1:${port}/popup.html`
  console.log('Serving:', outDir, 'at', url)

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 800, height: 600 } })
  const page = await context.newPage()

  const consoleMsgs = []
  const pageErrors = []
  const failedRequests = []
  page.on('console', m => consoleMsgs.push(`[${m.type()}] ${m.text()}`))
  page.on('pageerror', e => pageErrors.push(`${e.name}: ${e.message}`))
  page.on('requestfailed', req => {
    failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`)
  })

  console.log('Loading:', url)
  await page.goto(url)
  await page.waitForTimeout(2_500)

  const inspect = await page.evaluate(() => {
    const root = document.getElementById('root')
    return {
      bodyWidth: document.body.offsetWidth,
      bodyHeight: document.body.offsetHeight,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      rootChildren: root ? root.children.length : 0,
      rootText: root ? root.textContent?.trim().slice(0, 200) : null,
      rootHTML: root ? root.innerHTML.slice(0, 400) : null,
    }
  })

  console.log('\n=== Body ===')
  console.log(`  ${inspect.bodyWidth} × ${inspect.bodyHeight}, bg=${inspect.bodyBg}`)
  console.log('\n=== Root ===')
  console.log(`  children=${inspect.rootChildren}`)
  console.log(`  text: "${inspect.rootText}"`)
  console.log(`  HTML: ${inspect.rootHTML}`)

  console.log('\n=== Failed requests ===')
  if (failedRequests.length === 0) console.log('  (none)')
  for (const r of failedRequests) console.log('  ' + r)

  console.log('\n=== Page errors ===')
  if (pageErrors.length === 0) console.log('  (none)')
  for (const e of pageErrors) console.log('  ' + e)

  console.log('\n=== Console ===')
  for (const m of consoleMsgs) console.log('  ' + m)

  await page.screenshot({ path: 'scripts/popup-smoke.png', fullPage: true })
  console.log('\n📸 Screenshot saved: scripts/popup-smoke.png')

  await browser.close()
  server.close()

  process.exit(inspect.rootChildren > 0 ? 0 : 1)
}

main().catch(e => {
  console.error(e)
  process.exit(2)
})
