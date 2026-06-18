import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "fs";
import { fileURLToPath, URL } from "node:url";

// Vite config for the standalone pi-web frontend.
//
// Replaces the old Next.js setup. Everything here is plain SPA:
// - React plugin for JSX/Fast Refresh
// - Tailwind v4 official Vite plugin (faster than PostCSS)
// - @ -> ./src alias to keep imports clean (`@/components/...` etc.)
// - Port 30143 + host:true so the LAN can reach dev (mirrors allowedDevOrigins
//   in pi-web-01/next.config.ts and the old frontend config)
const { version } = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf8"),
) as { version: string };

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  define: {
    // In Next.js these were `process.env.NEXT_PUBLIC_*`. Vite exposes only
    // VITE_* vars to the client; inlined here so the UI's "web vX.Y.Z / pi
    // vA.B.C" footer still works without a runtime fetch.
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(version),
    "import.meta.env.VITE_PI_VERSION": JSON.stringify("0.79.0"),
  },

  server: {
    port: 30143,
    host: true,
    strictPort: true,
  },

  preview: {
    port: 30143,
    host: true,
    strictPort: true,
  },

  build: {
    target: "es2020",
    outDir: "dist",
    sourcemap: true,
  },
});
