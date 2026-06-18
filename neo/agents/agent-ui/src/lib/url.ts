/**
 * Browser URL helpers. Replaces the bits of `next/navigation` that AppShell
 * uses (`useRouter().replace(...)` + `useSearchParams().get(...)`).
 *
 * No router library — we just talk to `window.history` directly and fire
 * `popstate` so any URL-reading hook re-renders.
 */

/**
 * Replace the current URL in place (no reload, no history entry).
 * `path` may be a relative path like "/", "?session=abc", or
 * "?session=abc&foo=bar". Accepts a leading "?" to replace just the
 * query string.
 */
export function replaceUrl(path: string): void {
  // Anchor onto the current origin so relative paths resolve correctly.
  const u = new URL(path, window.location.origin);
  const next = u.pathname + u.search + u.hash;
  // history.replaceState doesn't fire `popstate`, so we dispatch one
  // manually so listeners (useUrlSearchParams) re-read the URL.
  window.history.replaceState(null, "", next);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * Snapshot the current query string as a URLSearchParams.
 * Re-evaluate each call — no caching — so callers see fresh values.
 */
export function readSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}
