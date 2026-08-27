import type { Finding } from '@/types/findings'

export interface JsonExportOptions {
  pretty?: boolean
  wrapper?: boolean
  contractId?: string
}

/**
 * Serializes findings into JSON string.
 */
export function serializeJson(findings: Finding[] = [], options: JsonExportOptions = {}): string {
  const safeFindings = Array.isArray(findings) ? findings : []
  const spacing = options.pretty !== false ? 2 : undefined

  if (options.wrapper) {
    const payload = {
      generator: 'Soroban Guard',
      timestamp: new Date().toISOString(),
      ...(options.contractId ? { contractId: options.contractId } : {}),
      totalFindings: safeFindings.length,
      findings: safeFindings,
    }
    return JSON.stringify(payload, null, spacing)
  }

  return JSON.stringify(safeFindings, null, spacing)
}
