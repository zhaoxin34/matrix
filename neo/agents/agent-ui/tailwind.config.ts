import type { Config } from "tailwindcss";

/**
 * Tailwind config for the Vite + React 19 frontend.
 *
 * Tailwind v4 mostly reads configuration from src/index.css via @theme,
 * but `content` globs are still needed so Tailwind knows which files to
 * scan for class names. We point at the Vite source tree.
 */
const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
