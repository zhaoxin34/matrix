/**
 * Shared utility functions
 */

/** Generate a unique ID */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Get current timestamp in milliseconds */
export function getTimestamp(): number {
  return Date.now();
}

/** Safe JSON parse with fallback */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/** Throttle function */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/** Sleep utility */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Check if running in Chrome extension context */
export function isExtensionContext(): boolean {
  return typeof chrome !== "undefined" && chrome.runtime?.id !== undefined;
}

/** Log with prefix for debugging */
export function createLogger(prefix: string) {
  return {
    debug: (...args: unknown[]) => console.debug(`[${prefix}]`, ...args),
    info: (...args: unknown[]) => console.info(`[${prefix}]`, ...args),
    warn: (...args: unknown[]) => console.warn(`[${prefix}]`, ...args),
    error: (...args: unknown[]) => console.error(`[${prefix}]`, ...args),
  };
}
