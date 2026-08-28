import type { Finding } from '@/types/findings'

export type ExportFileFormat = 'sarif' | 'json' | 'csv'

export interface DownloadFindingsOptions {
  format: ExportFileFormat
  findings: Finding[]
  contractId?: string | null
  filename?: string
}

export async function downloadFindings({
  format,
  findings,
  contractId,
  filename,
}: DownloadFindingsOptions): Promise<{ success: boolean; filename: string }> {
  const res = await fetch('/api/export/download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      format,
      findings,
      contractId: contractId || undefined,
      filename,
    }),
  })

  if (!res.ok) {
    let errorMsg = `Download failed with status ${res.status}`
    try {
      const json = await res.json()
      if (json.error) errorMsg = json.error
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg)
  }

  // Parse filename from Content-Disposition header if available
  let resolvedFilename = filename || `soroban-guard-findings.${format}`
  const disposition = res.headers.get('Content-Disposition')
  if (disposition) {
    const match = /filename=["']?([^"';]+)["']?/.exec(disposition)
    if (match && match[1]) {
      resolvedFilename = match[1].trim()
    }
  }

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = resolvedFilename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, 100)

  return { success: true, filename: resolvedFilename }
}
