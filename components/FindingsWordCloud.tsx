'use client'

import { useMemo } from 'react'
import type { Finding } from '@/types/findings'
import { extractTerms } from '@/lib/wordCloud'

interface Props {
  findings: Finding[]
  onTermClick?: (term: string) => void
}

const COLORS = [
  '#818cf8', // indigo-400
  '#a78bfa', // violet-400
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#fb923c', // orange-400
  '#f472b6', // pink-400
  '#38bdf8', // sky-400
]

export default function FindingsWordCloud({ findings, onTermClick }: Props) {
  const terms = useMemo(() => extractTerms(findings), [findings])
  const entries = Object.entries(terms)

  if (entries.length === 0) return null

  const maxFreq = entries[0][1]
  const minFreq = entries[entries.length - 1][1]
  const range = maxFreq - minFreq || 1

  // Font size: 12px (min) to 36px (max)
  function fontSize(freq: number): number {
    return Math.round(12 + ((freq - minFreq) / range) * 24)
  }

  // Lay out words in a simple wrapping flex layout
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-5"
      role="list"
      aria-label="Findings word cloud"
    >
      {entries.map(([term, freq], i) => (
        <button
          key={term}
          role="listitem"
          onClick={() => onTermClick?.(term)}
          title={`${term} (${freq})`}
          style={{
            fontSize: `${fontSize(freq)}px`,
            color: COLORS[i % COLORS.length],
            lineHeight: 1.2,
          }}
          className="cursor-pointer rounded px-1 font-semibold transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {term}
        </button>
      ))}
    </div>
  )
}
