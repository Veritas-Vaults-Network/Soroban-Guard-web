'use client'

import { useState } from 'react'
import type { Finding, Severity } from '@/types/findings'
import { groupByFunction } from '@/lib/groupFindings'
import SeverityBadge from './SeverityBadge'
import FindingsTable from './FindingsTable'

const SEVERITY_ORDER: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4,
}

function highestSeverity(findings: Finding[]): Severity {
  return findings.reduce<Severity>(
    (best, f) => (SEVERITY_ORDER[f.severity] < SEVERITY_ORDER[best] ? f.severity : best),
    'Info',
  )
}

export default function FindingsByFunction({ findings }: { findings: Finding[] }) {
  const groups = groupByFunction(findings)

  const sorted = Object.entries(groups).sort(([, a], [, b]) => {
    const diff = SEVERITY_ORDER[highestSeverity(a)] - SEVERITY_ORDER[highestSeverity(b)]
    if (diff !== 0) return diff
    return b.length - a.length
  })

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sorted.map(([name]) => [name, true])),
  )

  function toggle(name: string) {
    setOpen(prev => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map(([name, items]) => {
        const top = highestSeverity(items)
        const isOpen = open[name]
        return (
          <div key={name} className="rounded-xl border border-[var(--border)] overflow-hidden">
            <button
              onClick={() => toggle(name)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#1a1d27] transition"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3 min-w-0">
                <SeverityBadge severity={top} size="sm" />
                <span className="truncate font-mono text-sm font-medium text-slate-200">{name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-500">{items.length} finding{items.length !== 1 ? 's' : ''}</span>
                <svg
                  className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-[var(--border)]">
                <FindingsTable findings={items} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
