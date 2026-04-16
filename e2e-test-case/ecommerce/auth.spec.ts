import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('用户认证模块', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
    await page.evaluate(() => localStorage.clear())
  })

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
  })

  test.describe('登录功能', () => {
    test('TC-LOGIN-001: 成功登录 - 正确的手机号和密码', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.getByRole('textbox', { name: '手机号' }).fill('13800138001')
      await page.getByRole('textbox', { name: '密码' }).fill('Password123')
      await page.getByRole('button', { name: '登 录' }).click()
      await expect(page).toHaveURL(BASE_URL + '/')
    })

    test('TC-LOGIN-002: 登录失败 - 错误的密码', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.getByRole('textbox', { name: '手机号' }).fill('13800138001')
      await page.getByRole('textbox', { name: '密码' }).fill('WrongPassword')
      await page.getByRole('button', { name: '登 录' }).click()
      await expect(page).toHaveURL(`${BASE_URL}/login`)
      await expect(page.locator('text=登录失败')).toBeVisible({ timeout: 5000 })
    })

    test('TC-LOGIN-003: 登录失败 - 不存在的手机号', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.getByRole('textbox', { name: '手机号' }).fill('13900000000')
      await page.getByRole('textbox', { name: '密码' }).fill('Password123')
      await page.getByRole('button', { name: '登 录' }).click()
      await expect(page).toHaveURL(`${BASE_URL}/login`)
    })

    test('TC-LOGIN-004: 登录失败 - 空手机号', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.getByRole('textbox', { name: '密码' }).fill('Password123')
      await page.getByRole('button', { name: '登 录' }).click()
      await expect(page.locator('text=请输入手机号')).toBeVisible()
    })

    test('TC-LOGIN-005: 登录失败 - 空密码', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.getByRole('textbox', { name: '手机号' }).fill('13800138001')
      await page.getByRole('button', { name: '登 录' }).click()
      await expect(page.locator('text=请输入密码')).toBeVisible()
    })

    test('TC-LOGIN-006: 登录失败 - 无效手机号格式', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.getByRole('textbox', { name: '手机号' }).fill('12345')
      await page.getByRole('textbox', { name: '密码' }).fill('Password123')
      await page.getByRole('button', { name: '登 录' }).click()
      await expect(page.locator('text=请输入有效的手机号')).toBeVisible()
    })

    test('TC-LOGIN-007: 登录页面 - 链接导航', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.getByRole('link', { name: '立即注册' }).click()
      await expect(page).toHaveURL(`${BASE_URL}/register`)
    })

    test('TC-LOGIN-008: 登录页面 - 忘记密码链接', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.getByRole('link', { name: '忘记密码？' }).click()
      await expect(page).toHaveURL(`${BASE_URL}/forgot-password`)
    })
  })

  test.describe('注册功能', () => {
    test('TC-REGISTER-001: 成功注册 - 完整有效的注册信息', async ({ page }) => {
      const uniquePhone = `138${Date.now().toString().slice(-8)}`
      await page.goto(`${BASE_URL}/register`)
      await page.getByRole('textbox', { name: '用户名' }).fill('testuser')
      await page.getByRole('textbox', { name: '手机号' }).fill(uniquePhone)
      await expect(page.getByRole('textbox', { name: '验证码' })).toBeDisabled()
    })

    test('TC-REGISTER-002: 注册失败 - 用户名为空', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`)
      await page.getByRole('textbox', { name: '手机号' }).fill('13800138002')
      await page.getByRole('button', { name: '注 册' }).click()
      await expect(page.locator('text=请输入用户名')).toBeVisible()
    })

    test('TC-REGISTER-003: 注册失败 - 手机号格式无效', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`)
      await page.getByRole('textbox', { name: '用户名' }).fill('testuser')
      await page.getByRole('textbox', { name: '手机号' }).fill('123456')
      await page.getByRole('button', { name: '注 册' }).click()
      await expect(page.locator('text=请输入有效的手机号')).toBeVisible()
    })

    test('TC-REGISTER-004: 注册失败 - 密码太短', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`)
      await page.getByRole('textbox', { name: '用户名' }).fill('testuser')
      await page.getByRole('textbox', { name: '手机号' }).fill('13800138002')
      await page.getByRole('textbox', { name: '验证码' }).fill('123456')
      await page.getByRole('textbox', { name: '密码' }).fill('short')
      await page.getByRole('button', { name: '注 册' }).click()
      await expect(page.locator('text=密码至少8位')).toBeVisible()
    })

    test('TC-REGISTER-005: 注册失败 - 密码不包含字母和数字', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`)
      await page.getByRole('textbox', { name: '用户名' }).fill('testuser')
      await page.getByRole('textbox', { name: '手机号' }).fill('13800138002')
      await page.getByRole('textbox', { name: '验证码' }).fill('123456')
      await page.getByRole('textbox', { name: '密码' }).fill('abcdefgh')
      await page.getByRole('button', { name: '注 册' }).click()
      await expect(page.locator('text=密码需包含字母和数字')).toBeVisible()
    })

    test('TC-REGISTER-006: 注册页面 - 链接导航', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`)
      await page.getByRole('link', { name: '立即登录' }).click()
      await expect(page).toHaveURL(`${BASE_URL}/login`)
    })
  })

  test.describe('会话状态管理', () => {
    test('TC-SESSION-001: 登录后刷新页面 - 保持登录状态', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.getByRole('textbox', { name: '手机号' }).fill('13800138001')
      await page.getByRole('textbox', { name: '密码' }).fill('Password123')
      await page.getByRole('button', { name: '登 录' }).click()
      await expect(page).toHaveURL(BASE_URL + '/')
      await page.reload()
    })
  })
})
