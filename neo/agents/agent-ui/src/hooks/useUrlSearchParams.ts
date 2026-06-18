/**
 * Re-render when the URL query string changes. Drop-in replacement for
 * Next.js's `useSearchParams()` from `next/navigation`.
 *
 * Reads `window.location.search` and re-reads on `popstate` (fired by the
 * browser's back/forward buttons AND by our own `replaceUrl()` helper
 * which dispatches it manually after `history.replaceState`).
 */
import { useState, useEffect } from "react";
import { readSearchParams } from "@/lib/url";

export function useUrlSearchParams(): URLSearchParams {
  const [params, setParams] = useState(() => readSearchParams());

  useEffect(() => {
    const onChange = () => setParams(readSearchParams());
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
    };
  }, []);

  return params;
}
