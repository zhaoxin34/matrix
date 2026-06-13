import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  // 明确设置源码目录（根目录）
  srcDir: '.',

  // 入口点目录
  entrypointsDir: 'entrypoints',
  dev: {
    server: {
      port: 3030,
    },
  },

  // CRITICAL for Chrome extensions: Vite defaults to absolute paths
  // (e.g. /chunks/popup.js) which don't resolve under
  // chrome-extension://[id]/. We must use relative paths so the popup
  // HTML can locate its JS and CSS bundles at runtime.
  //
  // sourcemap: false disables inline source maps; some users have
  // reported that Chrome occasionally mis-reports valid UTF-8 content
  // scripts as "not UTF-8 encoded" when the bundle contains inline
  // source maps, so we play it safe.
  vite: () => ({
    base: '',
    build: {
      sourcemap: false,
    },
  }),

  manifest: {
    // 用于 popup 中嵌入 iframe 拉取 user info（见 src/auth/iframe-bridge.ts）
    // 本地开发覆盖最常见端口；生产域名通过运行时配置（api_base_url / frontend_base_url）扩展
    host_permissions: ['http://localhost:3000/*', 'http://127.0.0.1:3000/*'],
  },
})
