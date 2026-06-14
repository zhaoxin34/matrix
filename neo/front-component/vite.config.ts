import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 默认 config: 跑所有组件 demo (dev server, multi-page)
export default defineConfig({
  server: {
    port: 5100,
    open: '/demo/dom-snapshot/',
    host: '127.0.0.1',
  },
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        domSnapshot: resolve(__dirname, 'demo/dom-snapshot/index.html'),
        // 未来:
        // ariaTree: resolve(__dirname, 'demo/aria-tree/index.html'),
      },
    },
  },
});
