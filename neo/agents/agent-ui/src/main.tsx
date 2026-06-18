/**
 * Vite entry point. Replaces app/layout.tsx + app/page.tsx in the old
 * Next.js setup. Renders <App /> into #root (see index.html).
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Vite entry: #root element not found in index.html");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
