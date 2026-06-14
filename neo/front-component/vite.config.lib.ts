import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 库构建 config: 多入口,每个组件一个 entry
// 产出:
//   dist/index.js            (ESM barrel)
//   dist/index.cjs           (CJS barrel)
//   dist/dom-snapshot/index.js   (ESM)
//   dist/dom-snapshot/index.cjs  (CJS)
//   dist/dom-snapshot/*.d.ts     (via tsc --emitDeclarationOnly)
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'dom-snapshot/index': resolve(__dirname, 'src/dom-snapshot/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format: string, entryName: string) =>
        format === 'es' ? `${entryName}.js` : `${entryName}.cjs`,
    },
    rollupOptions: {
      external: [],
    },
    sourcemap: true,
  },
});
