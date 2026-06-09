import { test, expect, type BrowserContext } from '@playwright/test';
import path from 'path';

const pathToExtension = path.resolve('.output/chrome-mv3');

const testExt = test.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let background: { url(): string };
    [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent('serviceworker');
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

const { describe } = testExt;

describe('SteerButton Content Script', () => {
  testExt('should render SteerButton on test page', async ({ context }) => {
    const page = await context.newPage();
    
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    const pageErrors: string[] = [];
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    console.log('\n=== Navigating to localhost:5173 ===');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);
    
    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    console.log('\n=== Page Errors ===');
    pageErrors.forEach(err => console.log(err));
    
    // 深度检查 DOM 结构
    const result = await page.evaluate(() => {
      const info: string[] = [];
      
      info.push(`Page URL: ${window.location.href}`);
      
      // 查找 NEO-STEER-BUTTON
      const steerButtons = document.querySelectorAll('neo-steer-button');
      info.push(`neo-steer-button elements: ${steerButtons.length}`);
      
      for (const el of Array.from(steerButtons)) {
        info.push(`  Tag: ${el.tagName}`);
        info.push(`  ID: ${el.id}`);
        info.push(`  Class: ${el.className}`);
        info.push(`  OuterHTML (first 500): ${el.outerHTML.substring(0, 500)}`);
        
        // 检查 shadowRoot
        if (el.shadowRoot) {
          info.push(`  Has shadowRoot: yes`);
          const shadowContent = el.shadowRoot.querySelector('.steer-fab-container');
          info.push(`  .steer-fab-container in shadow: ${!!shadowContent}`);
          
          if (shadowContent) {
            info.push(`  Shadow content: ${shadowContent.outerHTML.substring(0, 300)}`);
          }
        } else {
          info.push(`  Has shadowRoot: NO`);
        }
      }
      
      // 检查是否有 steer-fab-container
      const fabContainer = document.querySelector('.steer-fab-container');
      info.push(`.steer-fab-container anywhere: ${!!fabContainer}`);
      
      // 检查是否有 steer-fab button
      const fabButton = document.querySelector('.steer-fab');
      info.push(`.steer-fab anywhere: ${!!fabButton}`);
      
      // 获取 body 的计算样式
      const bodyStyle = window.getComputedStyle(document.body);
      info.push(`Body position: ${bodyStyle.position}`);
      info.push(`Body overflow: ${bodyStyle.overflow}`);
      
      // 检查页面中是否有任何 fixed 定位的元素
      const fixedElements = document.querySelectorAll('[style*="fixed"]');
      info.push(`Elements with fixed in style: ${fixedElements.length}`);
      
      return info.join('\n');
    });
    
    console.log('\n=== DOM Analysis ===');
    console.log(result);
    
    // 检查 neo-steer-button 是否存在
    expect(result).toContain('neo-steer-button elements: 1');
    
    await page.close();
  });
  
  testExt('take screenshot', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);
    
    // 截图看看实际效果
    await page.screenshot({ path: '/tmp/steer-button-test.png' });
    console.log('Screenshot saved to /tmp/steer-button-test.png');
    
    await page.close();
  });
});

import { chromium } from '@playwright/test';
