import type { ContractScanRecord } from '@/types/stellar'

export interface Analytics {
  totalScans: number
  avgScore: number
  topChecks: { name: string; count: number }[]
  totalFindings: { high: number; medium: number; low: number }
}

/**
 * Compute aggregate analytics from an array of scan records.
 * @param records - Array of contract scan records
 * @returns Aggregated analytics including totals, average score, and top checks
 */
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

/**
 * Build a daily time-series of how often a specific check fired.
 * @param records - Array of contract scan records
 * @param checkName - The check name to track
 * @returns Array of { date, count } sorted chronologically
 */
export function checkTrend(
  records: ContractScanRecord[],
  checkName: string,
): { date: string; count: number }[] {
  const counts: Record<string, number> = {}

  for (const record of records) {
    const date = record.scannedAt.slice(0, 10) // YYYY-MM-DD
    counts[date] = (counts[date] ?? 0)
    for (const f of record.findings) {
      if (f.check_name === checkName) {
        counts[date]++
      }
    }
  }

  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))
}

/**
 * Collect all unique check names across all scan records.
 * @param records - Array of contract scan records
 * @returns Sorted array of unique check names
 */
export function allCheckNames(records: ContractScanRecord[]): string[] {
  const names = new Set<string>()
  for (const record of records) {
    for (const f of record.findings) {
      names.add(f.check_name)
    }
  }
  return Array.from(names).sort()
}

export function scoreTrend(records: ContractScanRecord[]): { date: string; count: number }[] {
  // Group by day (YYYY-MM-DD)
  const daily: Record<string, { total: number; count: number }> = {}

  for (const record of records) {
    const date = record.scannedAt.slice(0, 10) // YYYY-MM-DD
    if (!daily[date]) {
      daily[date] = { total: 0, count: 0 }
    }
    daily[date].total += record.findingCount
    daily[date].count++
  }

  // Compute average and convert to array
  const result: { date: string; count: number }[] = Object.entries(daily).map(
    ([date, { total, count }]) => ({
      date,
      count: Math.round((total / count) * 10) / 10, // Keep one decimal place
    })
  )

  // Sort by date ascending
  result.sort((a, b) => a.date.localeCompare(b.date))
  return result
}
