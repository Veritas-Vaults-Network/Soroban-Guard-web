import type { Finding } from '@/types/findings'

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return '""'
  }
  const str = String(val)
  // Check if quoting is needed: contains comma, quote, or newline
  const needsQuotes = /[",\r\n]/.test(str)
  const escaped = str.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : `"${escaped}"`
}

/**
 * Serializes findings into RFC-4180 compliant CSV.
 */
export function serializeCsv(findings: Finding[] = []): string {
  const headers = ['Check Name', 'Severity', 'File', 'Line', 'Function', 'Description', 'Remediation']
  const headerLine = headers.map(h => `"${h}"`).join(',')

  const safeFindings = Array.isArray(findings) ? findings : []
  const rows = safeFindings.map(f => {
    return [
      escapeCsvField(f.check_name),
      escapeCsvField(f.severity),
      escapeCsvField(f.file_path),
      escapeCsvField(f.line),
      escapeCsvField(f.function_name),
      escapeCsvField(f.description),
      escapeCsvField(f.remediation || ''),
    ].join(',')
  })

  return [headerLine, ...rows].join('\n')
}
