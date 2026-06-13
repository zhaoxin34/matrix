import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// 默认 config: 跑 demo 页面 (dev server + index.html)
export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5100,
    open: true,
    host: '127.0.0.1',
  },
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
