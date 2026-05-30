'use client'

import { getDueScans, markRan } from './schedule'

/**
 * Checks localStorage for due scheduled scans and triggers them via the
 * /api/cron/scheduled-scans route. Call this once on app load (e.g. from the
 * history page or a top-level layout effect).
 */
export async function runScheduledScans(): Promise<void> {
  const due = getDueScans()
  if (due.length === 0) return

  try {
    const res = await fetch('/api/cron/scheduled-scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scans: due.map(s => ({ contractId: s.contractId, network: s.network })),
      }),
    })

    if (!res.ok) return

    const data = (await res.json()) as {
      triggered: number
      succeeded: number
      failed: number
    }

    // Mark all due scans as ran regardless of individual success/failure so we
    // don't hammer the API on every page load if the scan service is down.
    for (const scan of due) {
      markRan(scan.contractId, scan.network)
    }
  } catch {
    // Network error — silently skip, will retry next time
  }
}
