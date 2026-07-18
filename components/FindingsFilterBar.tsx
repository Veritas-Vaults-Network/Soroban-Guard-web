'use client'

import { useMemo, useState } from 'react'
import type { Finding, Severity } from '@/types/findings'
import type { FilterState } from '@/lib/filterFindings'
import { isMuted } from '@/lib/mutedFindings'
import BottomSheet from './BottomSheet'
import SeverityBadge from './SeverityBadge'

const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low', 'Info']

interface Props {
  findings: Finding[]
  filterState: FilterState
  onFilterChange: (state: FilterState) => void
  muteTrigger?: number
}

export default function FindingsFilterBar({ findings, filterState, onFilterChange, muteTrigger }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const { severities, fileFilter, showMuted } = filterState

  const severityCounts = useMemo(() => {
    const file = fileFilter.trim().toLowerCase()
    const counts: Record<Severity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 }
    for (const f of findings) {
      if (file && !f.file_path.toLowerCase().includes(file)) continue
      if (!showMuted && isMuted(f)) continue
      counts[f.severity]++
    }
    return counts
  }, [findings, fileFilter, showMuted, muteTrigger])

  function toggleSeverity(severity: Severity) {
    const next = new Set(severities)
    if (next.has(severity)) next.delete(severity)
    else next.add(severity)
    onFilterChange({ ...filterState, severities: next })
  }

  function handleFileChange(value: string) {
    onFilterChange({ ...filterState, fileFilter: value })
  }

  function toggleMuted() {
    onFilterChange({ ...filterState, showMuted: !showMuted })
  }

  function handleClear() {
    onFilterChange({
      severities: new Set(SEVERITIES),
      fileFilter: '',
      showMuted: false,
    })
  }

  const hasActiveFilters = severities.size < SEVERITIES.length || fileFilter.trim() !== '' || showMuted
  const activeFilterCount =
    (severities.size < SEVERITIES.length ? 1 : 0) +
    (fileFilter.trim() ? 1 : 0) +
    (showMuted ? 1 : 0)

  const filtersContent = (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {/* Severity chips */}
      <div className="flex flex-wrap gap-2">
        {SEVERITIES.map(severity => {
          const count = severityCounts[severity]
          if (count === 0) return null
          const isActive = severities.has(severity)
          return (
            <button
              key={severity}
              onClick={() => toggleSeverity(severity)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/50'
                  : 'bg-[var(--bg-tertiary)] text-slate-400 hover:bg-[var(--bg-hover)] hover:text-slate-200'
              }`}
              aria-pressed={isActive}
            >
              <SeverityBadge severity={severity} size="sm" includeIcon={false} />
              <span>{severity}</span>
              <span className="ml-0.5 rounded-md bg-[var(--bg)] px-1.5 py-0.5 text-[10px] tabular-nums text-slate-500">
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* File name filter */}
      <div className="relative min-w-[160px]">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={fileFilter}
          onChange={e => handleFileChange(e.target.value)}
          placeholder="Filter by file..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] py-1.5 pl-8 pr-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {fileFilter && (
          <button
            onClick={() => handleFileChange('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Muted toggle */}
      <button
        onClick={toggleMuted}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          showMuted
            ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/50'
            : 'bg-[var(--bg-tertiary)] text-slate-400 hover:bg-[var(--bg-hover)] hover:text-slate-200'
        }`}
        aria-pressed={showMuted}
      >
        {showMuted ? 'Muted & active' : 'Active only'}
      </button>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={handleClear}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-slate-500 transition-colors hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Clear filters
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <div className="sticky top-0 z-10 mb-4 hidden bg-[var(--bg)]/80 py-2 backdrop-blur-sm sm:block">
        {filtersContent}
      </div>

      {/* Mobile */}
      <div className="mb-4 sm:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-slate-400 transition hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m3-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4h2" />
          </svg>
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}
        </button>

        <BottomSheet open={mobileOpen} onClose={() => setMobileOpen(false)} title="Filters">
          {filtersContent}
        </BottomSheet>
      </div>
    </>
  )
}
