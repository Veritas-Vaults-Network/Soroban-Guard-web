'use client'

import { useEffect, useState } from 'react'
import type { ScanQuota } from '@/lib/api'

export default function ScanQuotaIndicator({ quota }: { quota: ScanQuota }) {
  const [remaining, setRemaining] = useState(quota.remaining)

  // Reset remaining count when the reset time passes
  useEffect(() => {
    setRemaining(quota.remaining)
    const delay = quota.resetAt - Date.now()
    if (delay <= 0) return
    const t = setTimeout(() => setRemaining(quota.limit), delay)
    return () => clearTimeout(t)
  }, [quota])

  const pct = Math.max(0, Math.min(100, (remaining / quota.limit) * 100))
  const low = remaining < 5

  return (
    <div className="mt-4 space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          <span className={low ? 'font-semibold text-red-400' : 'text-slate-400'}>{remaining}</span>
          {' '}of {quota.limit} scans remaining today
        </span>
        {low && <span className="text-red-400">Limit almost reached</span>}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${low ? 'bg-red-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={remaining}
          aria-valuemin={0}
          aria-valuemax={quota.limit}
          aria-label={`${remaining} scans remaining`}
        />
      </div>
    </div>
  )
}
