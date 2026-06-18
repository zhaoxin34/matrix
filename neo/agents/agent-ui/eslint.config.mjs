// Flat ESLint config for the Vite + React 19 frontend.
//
// We replaced `eslint-config-next` (which had Next.js-specific rules
// that don't apply to a Vite SPA) with the smaller, faster combo of
// `eslint` core + `eslint-plugin-react-hooks` for the rules we actually
// need to enforce. `@typescript-eslint/parser` is needed so ESLint's
// default Espree parser doesn't choke on TS syntax (interfaces,
// generics, type annotations) in .ts/.tsx files.

import reactHooks from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "dist",
      "node_modules",
      ".next",
      "*.tsbuildinfo",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        EventSource: "readonly",
        PopStateEvent: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        // Node globals (vite.config.ts)
        process: "readonly",
        // Common
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        AbortController: "readonly",
        Blob: "readonly",
        FormData: "readonly",
        File: "readonly",
        FileReader: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        crypto: "readonly",
        navigator: "readonly",
        location: "readonly",
        history: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLDivElement: "readonly",
        HTMLTextAreaElement: "readonly",
        Event: "readonly",
        MouseEvent: "readonly",
        KeyboardEvent: "readonly",
        DragEvent: "readonly",
        ClipboardEvent: "readonly",
        React: "readonly",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
    },
  },
];
