const KEY = 'sg_source_code'

export function saveSourceCode(source: string) {
  try {
    sessionStorage.setItem(KEY, source)
  } catch {
    // sessionStorage unavailable (SSR or quota exceeded)
  }
}

export function loadSourceCode(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function clearSourceCode() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
