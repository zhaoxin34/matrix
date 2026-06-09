import { test, type BrowserContext } from '@playwright/test'
import path from 'path'

const pathToExtension = path.resolve('.output/chrome-mv3')

const testExt = test.extend<{
  context: BrowserContext
  extensionId: string
}>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    let background: { url(): string }
    ;[background] = context.serviceWorkers()
    if (!background) background = await context.waitForEvent('serviceworker')
    const extensionId = background.url().split('/')[2]
    await use(extensionId)
  },
})

const { describe } = testExt

describe('SteerButton Content Script', () => {
  testExt('check steer button in shadow DOM', async ({ context }) => {
    const page = await context.newPage()

    const consoleMessages: string[] = []
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
    })

    await page.goto('http://localhost:5173/')
    await page.waitForTimeout(3000)

    console.log('\n=== Console Messages ===')
    consoleMessages.forEach(msg => console.log(msg))

    // 详细检查 shadow DOM 结构
    const result = await page.evaluate(() => {
      const info: string[] = []

      // 查找 neo-steer-button
      const neoElement = document.querySelector('neo-steer-button')
      info.push(`neo-steer-button found: ${!!neoElement}`)

      if (neoElement) {
        // @ts-ignore
        const shadow = neoElement.shadowRoot
        info.push(`shadowRoot found: ${!!shadow}`)

        if (shadow) {
          // 详细列出 shadow 内的所有内容
          info.push(`\nShadow DOM content:`)
          info.push(`  children.length: ${shadow.children.length}`)
          info.push(`  childNodes.length: ${shadow.childNodes.length}`)

          // 遍历所有子节点
          shadow.childNodes.forEach((node, i) => {
            info.push(`  childNode[${i}]: ${node.nodeName} (${node.nodeType})`)
          })

          // 遍历所有子元素
          Array.from(shadow.children).forEach((child, i) => {
            info.push(
              `  child[${i}]: <${child.tagName.toLowerCase()}> id="${child.id}" class="${child.className}"`
            )

            // 检查是否有嵌套元素
            if (child.children.length > 0) {
              Array.from(child.children).forEach((nested, j) => {
                info.push(
                  `    nested[${j}]: <${nested.tagName.toLowerCase()}> class="${nested.className}"`
                )
              })
            }
          })

          // 检查样式
          const style = shadow.querySelector('style')
          info.push(`\nStyle found: ${!!style}`)
          if (style) {
            info.push(`Style content preview: ${style.textContent?.substring(0, 100)}...`)
          }

          // 检查 steer-fab-container
          const container = shadow.querySelector('.steer-fab-container')
          info.push(`\n.steer-fab-container found: ${!!container}`)

          if (container) {
            const computed = window.getComputedStyle(container)
            info.push(`Container styles:`)
            info.push(`  position: ${computed.position}`)
            info.push(`  width: ${computed.width}`)
            info.push(`  height: ${computed.height}`)
            info.push(`  bottom: ${computed.bottom}`)
            info.push(`  right: ${computed.right}`)

            // 检查按钮
            const fab = shadow.querySelector('.steer-fab')
            info.push(`\n.steer-fab found: ${!!fab}`)
            if (fab) {
              const fabComputed = window.getComputedStyle(fab)
              info.push(`FAB width: ${fabComputed.width}`)
              info.push(`FAB height: ${fabComputed.height}`)
            }
          }
        }
      }

      // 检查 :host 选择器（获取 shadow host 的样式）
      const host = neoElement as any
      const hostStyles = window.getComputedStyle(host)
      info.push(`\n:host (neo-steer-button) styles:`)
      info.push(`  display: ${hostStyles.display}`)
      info.push(`  position: ${hostStyles.position}`)
      info.push(`  bottom: ${hostStyles.bottom}`)
      info.push(`  right: ${hostStyles.right}`)
      info.push(`  z-index: ${hostStyles.zIndex}`)

      return info.join('\n')
    })

    console.log('\n=== DOM Analysis ===')
    console.log(result)

    await page.close()
  })

  testExt('screenshot', async ({ context }) => {
    const page = await context.newPage()
    await page.goto('http://localhost:5173/')
    await page.waitForTimeout(2000)

    await page.screenshot({ path: '/tmp/steer-button-final2.png', fullPage: true })
    console.log('Screenshot: /tmp/steer-button-final2.png')

    await page.close()
  })
})

import { chromium } from '@playwright/test'
