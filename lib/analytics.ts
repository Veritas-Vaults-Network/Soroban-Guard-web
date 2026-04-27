import type { ContractScanRecord } from '@/types/stellar'

export interface Analytics {
  totalScans: number
  avgScore: number
  topChecks: { name: string; count: number }[]
  totalFindings: { high: number; medium: number; low: number }
}

export function computeAnalytics(records: ContractScanRecord[]): Analytics {
  const totalScans = records.length

  const avgScore =
    totalScans === 0
      ? 0
      : Math.round(
          records.reduce((sum, r) => sum + r.findingCount, 0) / totalScans,
        )

  const checkCounts: Record<string, number> = {}
  const totals = { high: 0, medium: 0, low: 0 }

  for (const record of records) {
    totals.high += record.highCount
    totals.medium += record.mediumCount
    totals.low += record.lowCount
    for (const f of record.findings) {
      checkCounts[f.check_name] = (checkCounts[f.check_name] ?? 0) + 1
    }
  }

  const topChecks = Object.entries(checkCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  return { totalScans, avgScore, topChecks, totalFindings: totals }
}
