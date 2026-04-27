import type { Finding } from '@/types/findings'

export interface ReportMetadata {
  source: string
  scannedAt: string
  score: number
}

export function generatePdfReport(findings: Finding[], metadata: ReportMetadata): void {
  const params = new URLSearchParams({
    f: btoa(JSON.stringify(findings)),
    source: metadata.source,
    scannedAt: metadata.scannedAt,
    score: String(metadata.score),
  })
  window.open(`/report?${params.toString()}`, '_blank')
}
