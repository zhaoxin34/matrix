import { Page, Locator } from '@playwright/test'

export interface PopupPage {
  getBody: () => Locator
  getHeader: () => Locator
  getContent: () => Promise<string | null>
}

export async function openPopup(page: Page, extensionId: string): Promise<PopupPage> {
  await page.goto(`chrome-extension://${extensionId}/popup.html`)

  // 等待 popup 加载
  await page.waitForSelector('#root')

  const popup: PopupPage = {
    getBody: () => page.locator('body'),
    getHeader: () => page.locator('.header h1'),
    getContent: async () => {
      const body = await popup.getBody()
      return await body.textContent()
    },
  }

  return popup
}
