const KEY = 'sg_source_code'

/**
 * Persist source code to sessionStorage for cross-page access.
 * @param source - The contract source code to save
 */
export function saveSourceCode(source: string) {
  try {
    sessionStorage.setItem(KEY, source)
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
