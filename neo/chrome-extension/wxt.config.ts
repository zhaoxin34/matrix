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

  manifest: {
    // 用于 popup 中嵌入 iframe 拉取 user info（见 src/auth/iframe-bridge.ts）
    // 本地开发覆盖最常见端口；生产域名通过运行时配置（api_base_url / frontend_base_url）扩展
    host_permissions: ['http://localhost:3000/*', 'http://127.0.0.1:3000/*'],
  },
})
