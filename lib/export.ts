import type { Finding } from '@/types/findings'

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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function exportXml(findings: Finding[]) {
  try {
    const timestamp = new Date().toISOString()
    const totalFindings = findings.length
    const severityCounts = findings.reduce((acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<scanReport>
  <metadata>
    <tool>Soroban Guard</tool>
    <version>1.0.0</version>
    <timestamp>${timestamp}</timestamp>
    <totalFindings>${totalFindings}</totalFindings>
    <severityCounts>
      <critical count="${severityCounts.Critical || 0}" />
      <high count="${severityCounts.High || 0}" />
      <medium count="${severityCounts.Medium || 0}" />
      <low count="${severityCounts.Low || 0}" />
    </severityCounts>
  </metadata>
  <findings>`

    if (findings.length === 0) {
      xml += `
    <finding>
      <message>No vulnerabilities detected</message>
    </finding>`
    } else {
      findings.forEach((finding, index) => {
        xml += `
    <finding id="${index + 1}">
      <severity>${escapeXml(finding.severity)}</severity>
      <checkName>${escapeXml(finding.check_name)}</checkName>
      <functionName>${escapeXml(finding.function_name)}</functionName>
      <filePath>${escapeXml(finding.file_path)}</filePath>
      <line>${finding.line}</line>
      <description>${escapeXml(finding.description)}</description>
      ${finding.remediation ? `<remediation>${escapeXml(finding.remediation)}</remediation>` : ''}
    </finding>`
      })
    }

    xml += `
  </findings>
</scanReport>`

    const blob = new Blob([xml], { type: 'application/xml' })
    download('soroban-guard-scan-results.xml', blob)
  } catch (err) {
    console.error('exportXml failed', err)
  }
}
