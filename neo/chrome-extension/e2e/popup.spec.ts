import { test, expect } from './fixtures'

test.describe('Popup 配置页面', () => {
  test('配置页面加载成功', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`)

    // 等待 React 渲染完成
    await page.waitForSelector('.header', { timeout: 10000 })

    // 验证页面标题
    await expect(page).toHaveTitle(/Neo Agent/)

    // 验证 header 显示
    const header = page.locator('.header h1')
    await expect(header).toContainText('Neo Agent 配置')
  })

  test('显示默认配置值', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`)

    // 等待 React 渲染完成
    await page.waitForSelector('.form-input', { timeout: 10000 })

    // 验证前端地址输入框显示默认值
    const frontendInput = page.locator('input[type="url"]').first()
    await expect(frontendInput).toBeVisible()
    await expect(frontendInput).toHaveValue('http://localhost:3300')

    // 验证后端地址输入框显示默认值
    const backendInput = page.locator('input[type="url"]').nth(1)
    await expect(backendInput).toBeVisible()
    await expect(backendInput).toHaveValue('http://localhost:8000')
  })

  test('可以修改并保存配置', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`)

    // 等待 React 渲染完成
    await page.waitForSelector('.form-input', { timeout: 10000 })

    // 修改前端地址
    const frontendInput = page.locator('input[type="url"]').first()
    await frontendInput.clear()
    await frontendInput.fill('http://localhost:3000')

    // 点击保存按钮
    const saveButton = page.locator('button:has-text("保存配置")')
    await expect(saveButton).toBeVisible()
    await saveButton.click()

    // 验证状态显示
    const status = page.locator('.status')
    await expect(status).toBeVisible({ timeout: 5000 })
  })

  test('功能开关可以切换', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`)

    // 等待 React 渲染完成
    await page.waitForSelector('.toggle', { timeout: 10000 })

    // 查找录制开关
    const recordingToggle = page.locator('.toggle').first()
    await expect(recordingToggle).toBeVisible()

    // 获取初始状态
    const initialState = await recordingToggle.evaluate(el => el.classList.contains('active'))

    // 点击切换
    await recordingToggle.click()

    // 验证状态改变
    const newState = await recordingToggle.evaluate(el => el.classList.contains('active'))
    expect(newState).toBe(!initialState)
  })

  test('重置按钮恢复默认配置', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`)

    // 等待 React 渲染完成
    await page.waitForSelector('.form-input', { timeout: 10000 })

    // 修改配置
    const frontendInput = page.locator('input[type="url"]').first()
    await frontendInput.clear()
    await frontendInput.fill('http://custom.com')

    // 点击重置
    const resetButton = page.locator('button:has-text("重置")')
    await resetButton.click()

    // 验证恢复默认值
    await expect(frontendInput).toHaveValue('http://localhost:3300')
  })
})
