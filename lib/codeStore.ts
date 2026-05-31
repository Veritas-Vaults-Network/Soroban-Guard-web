const KEY = 'sg_source_code'
const MAX_SOURCE_BYTES = 500_000

/**
 * Sanitize source code before storage: strip null bytes and enforce size limit.
 */
function sanitize(source: string): string {
  // Remove null bytes (can cause issues in some parsers)
  // eslint-disable-next-line no-control-regex
  return source.replace(/\x00/g, '').slice(0, MAX_SOURCE_BYTES)
}

/**
 * Persist source code to sessionStorage for cross-page access.
 * @param source - The contract source code to save
 */
export function saveSourceCode(source: string) {
  try {
    sessionStorage.setItem(KEY, sanitize(source))
  } catch {
    // sessionStorage unavailable (SSR or quota exceeded)
  }
}

/**
 * Retrieve previously saved source code from sessionStorage.
 * @returns The saved source code, or null if not found
 */
export function loadSourceCode(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

/**
 * Remove saved source code from sessionStorage.
 */
export function clearSourceCode() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
