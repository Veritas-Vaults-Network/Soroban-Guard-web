'use client'

import type { BatchScanItem, BatchScanResult } from '@/lib/api'

interface BatchScanProgressProps {
  items: BatchScanItem[]
  batchResult: BatchScanResult | null
  loading: boolean
  onRetryItem?: (item: BatchScanItem) => void
  onViewResults?: () => void
}

export default function BatchScanProgress({
  items,
  batchResult,
  loading,
  onRetryItem,
  onViewResults,
}: BatchScanProgressProps) {
  if (items.length === 0) return null

  const doneCount = items.filter((i) => i.status === 'done').length
  const failedCount = items.filter((i) => i.status === 'failed').length
  const completedCount = doneCount + failedCount
  const totalCount = items.length
  const progressPct = Math.round((completedCount / totalCount) * 100)
  const totalFindings = batchResult?.totalFindings ?? items.reduce((s, i) => s + (i.findings?.length ?? 0), 0)

  return (
    <div className="mt-6 rounded-xl border border-[var(--border)] bg-[#12151f] p-5 shadow-lg space-y-5">
      {/* Header & Overall Summary */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span>Batch Scan Progress</span>
            {loading && (
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20 animate-pulse">
                In progress (Concurrency cap: 3)
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {completedCount} of {totalCount} contracts processed ({doneCount} succeeded, {failedCount} failed)
          </p>
        </div>

        {!loading && completedCount > 0 && onViewResults && (
          <button
            type="button"
            onClick={onViewResults}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Combined Results ({totalFindings} finding{totalFindings !== 1 ? 's' : ''})
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Overall Completion</span>
          <span className="font-semibold text-slate-200">{progressPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Per-Item Status List */}
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Individual Items ({items.length})
        </div>
        <div className="divide-y divide-slate-800/60 rounded-lg border border-slate-800/80 bg-slate-900/40">
          {items.map((item, idx) => {
            const label =
              item.source.length > 42
                ? `${item.source.slice(0, 24)}...${item.source.slice(-12)}`
                : item.source

            return (
              <div key={item.id || idx} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Indicator Icon */}
                  <ItemStatusIcon status={item.status} />
                  <div className="truncate min-w-0">
                    <p className="font-mono text-xs font-medium text-slate-200 truncate">{label}</p>
                    {item.error && (
                      <p className="text-xs text-red-400 mt-0.5 font-sans truncate">
                        {item.error}
                        {item.retryAfter ? ` (retry in ${item.retryAfter}s)` : ''}
                      </p>
                    )}
                    {item.status === 'done' && (
                      <p className="text-xs text-slate-400 font-sans mt-0.5">
                        {item.findings?.length ?? 0} finding{(item.findings?.length ?? 0) !== 1 ? 's' : ''} detected
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge & Action */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <ItemStatusBadge status={item.status} findingsCount={item.findings?.length} />
                  {item.status === 'failed' && onRetryItem && (
                    <button
                      type="button"
                      onClick={() => onRetryItem(item)}
                      className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 transition"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ItemStatusIcon({ status }: { status: BatchScanItem['status'] }) {
  if (status === 'pending') {
    return (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400 text-xs">
        ⏳
      </span>
    )
  }

  if (status === 'running') {
    return (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40">
        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      </span>
    )
  }

  if (status === 'done') {
    return (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )
  }

  return (
    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400 ring-1 ring-red-500/40">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </span>
  )
}

function ItemStatusBadge({
  status,
  findingsCount,
}: {
  status: BatchScanItem['status']
  findingsCount?: number
}) {
  if (status === 'pending') {
    return (
      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
        Pending
      </span>
    )
  }

  if (status === 'running') {
    return (
      <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300 font-medium">
        Scanning…
      </span>
    )
  }

  if (status === 'done') {
    return (
      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300 font-medium">
        Done ({findingsCount ?? 0})
      </span>
    )
  }

  return (
    <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300 font-medium">
      Failed
    </span>
  )
}
