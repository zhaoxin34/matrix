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
  }
})
