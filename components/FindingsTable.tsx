'use client'

import { useState } from 'react'
import type { Finding } from '@/types/findings'
import SeverityBadge from './SeverityBadge'
import FindingCard from './FindingCard'
import CheckTooltip from './CheckTooltip'

interface Props {
  findings: Finding[]
}

export default function FindingsTable({ findings }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  function toggle(i: number) {
    setExpandedIndex(prev => (prev === i ? null : i))
  }

  // Keyboard: allow Enter/Space to expand rows
  function handleKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle(i)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#2a2d3a]">
      {/* Table header */}
      <div className="hidden grid-cols-[120px_1fr_1fr_80px_1fr] gap-4 border-b border-[#2a2d3a] bg-[#12151f] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:grid">
        <span>Severity</span>
        <span>Check</span>
        <span>Function</span>
        <span>Line</span>
        <span>Description</span>
      </div>

      {findings.map((finding, i) => (
        <div key={i}>
          {/* Row */}
          <button
            onClick={() => toggle(i)}
            className={`w-full border-b border-[#2a2d3a] px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-[#1a1d27] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              expandedIndex === i ? 'bg-[#1a1d27]' : 'bg-[#0f1117]'
            }`}
            aria-expanded={expandedIndex === i}
          >
            {/* Mobile layout */}
            <div className="flex items-start justify-between gap-3 sm:hidden">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={finding.severity} size="sm" />
                  <CheckTooltip checkName={finding.check_name} />
                </div>
                <p className="line-clamp-2 text-sm text-slate-400">
                  {finding.description}
                </p>
              </div>
              <ChevronIcon expanded={expandedIndex === i} />
            </div>

            {/* Desktop layout */}
            <div className="hidden grid-cols-[120px_1fr_1fr_80px_1fr] items-center gap-4 sm:grid">
              <SeverityBadge severity={finding.severity} size="sm" />
              <CheckTooltip checkName={finding.check_name} />
              <span className="truncate font-mono text-sm text-slate-300">
                {finding.function_name}
              </span>
              <span className="font-mono text-sm text-slate-400">
                {finding.line}
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="line-clamp-1 text-sm text-slate-400">
                  {finding.description}
                </span>
                <ChevronIcon expanded={expandedIndex === i} />
              </div>
            </div>
          </button>

          {/* Expanded detail */}
          {expandedIndex === i && (
            <div className="border-b border-[#2a2d3a] bg-[#0c0e16] px-5 py-4 last:border-b-0">
              <FindingCard finding={finding} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform duration-200 ${
        expanded ? 'rotate-180' : ''
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}
