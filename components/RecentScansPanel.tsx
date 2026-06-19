'use client'

import { useState, useEffect } from 'react'
import {
  getRecent,
  removeRecent,
  getPinned,
  pinScan,
  unpinScan,
  truncateLabel,
} from '@/lib/recentScans'
import { formatRelative } from '@/lib/formatRelative'
import type { RecentScan } from '@/lib/recentScans'

interface Props {
  onLaunch: (value: string, type: RecentScan['type']) => void
}

export default function RecentScansPanel({ onLaunch }: Props) {
  const [scans, setScans] = useState<RecentScan[]>([])
  const [pinned, setPinned] = useState<string[]>([])
  const [query, setQuery] = useState('')

  function refresh() {
    setScans(getRecent())
    setPinned(getPinned())
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = query
    ? scans.filter(s => s.value.toLowerCase().includes(query.toLowerCase()))
    : scans

  const pinnedScans = filtered.filter(s => pinned.includes(s.value))
  const recentScans = filtered.filter(s => !pinned.includes(s.value))

  function handleRemove(scan: RecentScan) {
    removeRecent(scan.type, scan.value)
    refresh()
  }

  function handlePin(value: string) {
    pinScan(value)
    refresh()
  }

  function handleUnpin(value: string) {
    unpinScan(value)
    refresh()
  }

  if (scans.length === 0 && !query) {
    return (
      <nav aria-label="Recent scans" className="mt-4 py-4 text-center text-sm text-slate-500">
        Your recent scans will appear here.
      </nav>
    )
  }

  return (
    <nav aria-label="Recent scans" className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Recent Scans</span>
      </div>

      {/* Search */}
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
        <svg
          className="h-4 w-4 shrink-0 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          placeholder="Search recent scans…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none"
          aria-label="Search recent scans"
        />
      </div>

      {filtered.length === 0 && (
        <p className="py-4 text-center text-sm text-slate-500">No matches found.</p>
      )}

      {pinnedScans.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
            📌 Pinned
          </p>
          <ul className="space-y-1">
            {pinnedScans.map(scan => (
              <ScanRow
                key={scan.value}
                scan={scan}
                isPinned
                onLaunch={onLaunch}
                onPin={handlePin}
                onUnpin={handleUnpin}
                onRemove={handleRemove}
              />
            ))}
          </ul>
        </div>
      )}

      {recentScans.length > 0 && (
        <div>
          {pinnedScans.length > 0 && (
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
              Recent
            </p>
          )}
          <ul className="space-y-1">
            {recentScans.map(scan => (
              <ScanRow
                key={scan.value}
                scan={scan}
                isPinned={false}
                onLaunch={onLaunch}
                onPin={handlePin}
                onUnpin={handleUnpin}
                onRemove={handleRemove}
              />
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}

function ScanRow({
  scan,
  isPinned,
  onLaunch,
  onPin,
  onUnpin,
  onRemove,
}: {
  scan: RecentScan
  isPinned: boolean
  onLaunch: (value: string, type: RecentScan['type']) => void
  onPin: (value: string) => void
  onUnpin: (value: string) => void
  onRemove: (scan: RecentScan) => void
}) {
  const label = truncateLabel(scan)

  return (
    <li className="group flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 transition hover:border-indigo-500/40 hover:bg-[#1a1d27]">
      <button
        onClick={() => onLaunch(scan.value, scan.type)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        aria-label={`Re-scan ${label}`}
      >
        <span className="truncate font-mono text-sm text-slate-300">{label}</span>
        {scan.network && (
          <span className="shrink-0 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-xs capitalize text-indigo-400">
            {scan.network}
          </span>
        )}
        <span className="shrink-0 text-xs text-slate-600">{formatRelative(scan.timestamp)}</span>
      </button>

      <button
        onClick={() => (isPinned ? onUnpin(scan.value) : onPin(scan.value))}
        className="shrink-0 rounded p-1 text-slate-600 transition hover:text-amber-400"
        aria-label={isPinned ? 'Unpin scan' : 'Pin scan'}
        title={isPinned ? 'Unpin' : 'Pin'}
      >
        📌
      </button>

      <button
        onClick={() => onRemove(scan)}
        className="shrink-0 rounded p-1 text-slate-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100 focus:opacity-100"
        aria-label={`Remove ${label} from recent scans`}
        title="Remove"
      >
        ✕
      </button>
    </li>
  )
}
