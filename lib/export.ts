import type { Finding } from '@/types/findings'

export function exportMarkdown(
  findings: Finding[],
  metadata: { source: string; scannedAt: string },
): string {
  const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1

  const lines: string[] = [
    '# Soroban Guard Security Report',
    '',
    `**Source:** ${metadata.source}`,
    `**Scanned at:** ${metadata.scannedAt}`,
    '',
    '## Summary',
    '',
    '| Severity | Count |',
    '|----------|-------|',
    `| Critical | ${counts.Critical ?? 0} |`,
    `| High     | ${counts.High ?? 0} |`,
    `| Medium   | ${counts.Medium ?? 0} |`,
    `| Low      | ${counts.Low ?? 0} |`,
    `| **Total**| **${findings.length}** |`,
    '',
  ]

  if (findings.length === 0) {
    lines.push('No vulnerabilities found.')
  } else {
    lines.push('## Findings', '')
    for (const f of findings) {
      lines.push(
        `### [${f.severity}] ${f.check_name}`,
        '',
        `- **Function:** \`${f.function_name}\``,
        `- **File:** \`${f.file_path}\` (line ${f.line})`,
        `- **Description:** ${f.description}`,
      )
      if (f.remediation) lines.push(`- **Remediation:** ${f.remediation}`)
      lines.push('')
    }
  }

  return lines.join('\n')
}

export function downloadMarkdown(findings: Finding[], metadata: { source: string; scannedAt: string }) {
  try {
    const content = exportMarkdown(findings, metadata)
    const blob = new Blob([content], { type: 'text/markdown' })
    download('soroban-guard-report.md', blob)
  } catch (err) {
    console.error('downloadMarkdown failed', err)
  }
}

function download(filename: string, data: Blob) {
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function exportJson(findings: Finding[]) {
  try {
    const content = findings.length === 0 ? '' : JSON.stringify(findings, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    download('soroban-guard-findings.json', blob)
  } catch (err) {
    console.error('exportJson failed', err)
  }
}

function escapeCsv(value: any) {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function exportEmail(findings: Finding[]): string {
  const subject = encodeURIComponent('Soroban Guard Scan Results')
  let body: string
  if (findings.length === 0) {
    body = 'No vulnerabilities found.'
  } else {
    body = findings
      .map(
        (f, i) =>
          `${i + 1}. [${f.severity}] ${f.check_name}\n   Function: ${f.function_name}\n   File: ${f.file_path}, Line: ${f.line}\n   ${f.description}`,
      )
      .join('\n\n')
  }
  return `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`
}

export function exportCsv(findings: Finding[]) {
  try {
    const headers = ['severity', 'check_name', 'function_name', 'file_path', 'line', 'description']
    if (findings.length === 0) {
      const blob = new Blob([headers.join(',')], { type: 'text/csv' })
      download('soroban-guard-findings.csv', blob)
      return
    }

    const rows = findings.map(f => [f.severity, f.check_name, f.function_name, f.file_path, f.line, f.description])
    const csv = [headers.join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    download('soroban-guard-findings.csv', blob)
  } catch (err) {
    console.error('exportCsv failed', err)
  }
}
