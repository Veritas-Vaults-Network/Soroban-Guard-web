import type { Finding, Severity } from '@/types/findings'

export interface ReportMetadata {
  source: string
  scannedAt: string
  score: number
  walletAddress?: string
}

export interface ReportSection {
  id: string
  type: 'cover' | 'summary' | 'findings' | 'footer' | 'custom'
  props?: Record<string, unknown>
}

export interface ReportConfig {
  metadata: ReportMetadata
  findings: Finding[]
  sections: ReportSection[]
}

/**
 * Compute severity counts from a findings array.
 */
export function computeSeverityCounts(findings: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Info: 0,
  }
  for (const f of findings) {
    counts[f.severity as Severity]++
  }
  return counts
}

/**
 * Sort findings by severity (Critical first).
 */
export function sortBySeverity(findings: Finding[]): Finding[] {
  const order: Record<Severity, number> = {
    Critical: 0,
    High: 1,
    Medium: 2,
    Low: 3,
    Info: 4,
  }
  return [...findings].sort((a, b) => order[a.severity as Severity] - order[b.severity as Severity])
}

/**
 * Build a default ReportConfig for the given findings and metadata.
 * New report sections can be added here as report features grow,
 * without requiring manual coordinate math.
 */
export function buildReportConfig(findings: Finding[], metadata: ReportMetadata): ReportConfig {
  return {
    metadata,
    findings,
    sections: [
      { id: 'cover', type: 'cover' },
      { id: 'summary', type: 'summary' },
      { id: 'findings', type: 'findings' },
      { id: 'footer', type: 'footer' },
    ],
  }
}

/**
 * Encode report data into URL search params for the /report page.
 */
function encodeReportParams(findings: Finding[], metadata: ReportMetadata): string {
  const params = new URLSearchParams({
    f: btoa(JSON.stringify(findings)),
    source: metadata.source,
    scannedAt: metadata.scannedAt,
    score: String(metadata.score),
  })
  if (metadata.walletAddress) {
    params.set('wallet', metadata.walletAddress)
  }
  return params.toString()
}

/**
 * Open the print/PDF report page in a new tab with findings encoded in the URL.
 * Uses a declarative section-based layout: add new sections to buildReportConfig()
 * instead of manually positioning elements with coordinates.
 *
 * @param findings - Array of scan findings
 * @param metadata - Report metadata including source, scan time, score, and optional wallet address
 */
export function generatePdfReport(findings: Finding[], metadata: ReportMetadata): void {
  const config = buildReportConfig(findings, metadata)
  const queryString = encodeReportParams(config.findings, config.metadata)
  window.open(`/report?${queryString}`, '_blank')
}
