import en from '@/locale/en.json'

type Locale = typeof en

/**
 * Resolve a dot-separated key path in the locale object.
 * e.g. "scanInput.submit.scan" → "Scan Contract"
 */
function resolve(obj: unknown, path: string): string {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return path
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : path
}

/**
 * Minimal i18n hook. Returns a translation function `t` that looks up
 * keys in the English locale file and optionally interpolates variables.
 *
 * Usage:
 *   const { t } = useT()
 *   t('scanInput.submit.scan')                        // "Scan Contract"
 *   t('scanInput.code.tooLarge', { max: '500,000' })  // "Contract too large. Maximum 500,000 characters."
 */
export function useT(locale: Locale = en) {
  function t(key: string, vars?: Record<string, string | number>): string {
    let value = resolve(locale, key)
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replaceAll(`{${k}}`, String(v))
      }
    }
    return value
  }

  return { t }
}
