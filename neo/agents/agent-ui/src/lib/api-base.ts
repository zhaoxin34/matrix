/**
 * Single source of truth for the backend base URL.
 *
 * The frontend never hardcodes "/api/..." anymore — every fetch / EventSource
 * goes through `apiUrl("/api/...")`. In production, set VITE_API_URL
 * (in .env / .env.production) to the absolute origin of the backend
 * (e.g. `http://192.168.1.10:30141`). In dev with no env, we fall back to
 * a same-origin relative path, which works when the backend is reverse-
 * proxied at the same hostname.
 *
 * Vite env convention: only `VITE_*` vars are exposed to client code, and
 * they're read via `import.meta.env` (not `process.env`).
 */
const RAW_BASE = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");

/** Resolved backend origin (no trailing slash), or "" if not configured. */
export const API_BASE_URL: string = RAW_BASE;

/**
 * Build an absolute (or same-origin relative) URL for a backend API call.
 * `path` MUST start with "/". Example: `apiUrl("/api/sessions")`.
 */
export function apiUrl(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error(`apiUrl: path must start with "/", got "${path}"`);
  }
  return RAW_BASE ? `${RAW_BASE}${path}` : path;
}
