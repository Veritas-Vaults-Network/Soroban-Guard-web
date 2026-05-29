'use client'

import { useMemo, useState } from 'react'

interface Props {
  entries: { date: string }[]
}

function buildWeeks(): Date[][] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from 52 weeks ago, aligned to Sunday
  const start = new Date(today)
  start.setDate(start.getDate() - 364)
  // Rewind to the nearest Sunday
  start.setDate(start.getDate() - start.getDay())

  const weeks: Date[][] = []
  let current = new Date(start)

  while (current <= today) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function cellColor(count: number): string {
  if (count === 0) return 'bg-[#1a1d27] border-[#2a2d3a]'
  if (count === 1) return 'bg-indigo-900/60 border-indigo-700/40'
  if (count === 2) return 'bg-indigo-700/70 border-indigo-600/50'
  return 'bg-indigo-500 border-indigo-400/60'
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function ScanHeatmap({ entries }: Props) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

  const countMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of entries) {
      const key = new Date(e.date).toISOString().slice(0, 10)
      map[key] = (map[key] ?? 0) + 1
    }
    return map
  }, [entries])

  const weeks = useMemo(() => buildWeeks(), [])

  // Build month labels: find the first week where a new month starts
  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, col) => {
      const month = week[0].getMonth()
      if (month !== lastMonth) {
        labels.push({ label: MONTHS[month], col })
        lastMonth = month
      }
    })
    return labels
  }, [weeks])

  return (
    <div className="rounded-xl border border-[#2a2d3a] bg-[#12151f] p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-300">Scan activity — last 52 weeks</h2>

      {/* Month labels */}
      <div className="relative mb-1 flex" style={{ paddingLeft: '1.5rem' }}>
        {monthLabels.map(({ label, col }) => (
          <span
            key={`${label}-${col}`}
            className="absolute text-[10px] text-slate-500"
            style={{ left: `calc(1.5rem + ${col} * 14px)` }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex gap-[2px]" style={{ paddingLeft: '1.5rem' }}>
        {/* Day-of-week labels */}
        <div className="absolute flex flex-col gap-[2px]" style={{ marginLeft: '-1.5rem' }}>
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <span key={i} className="flex h-[12px] items-center text-[9px] text-slate-600">{i % 2 === 1 ? d : ''}</span>
          ))}
        </div>

        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((day, di) => {
              const key = toKey(day)
              const count = countMap[key] ?? 0
              const isFuture = day > new Date()
              const label = `${count} scan${count !== 1 ? 's' : ''} on ${day.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`

              return (
                <div
                  key={di}
                  className={`h-[12px] w-[12px] rounded-[2px] border cursor-default transition-opacity ${isFuture ? 'opacity-0 pointer-events-none' : cellColor(count)}`}
                  onMouseEnter={e => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect()
                    setTooltip({ text: label, x: rect.left + rect.width / 2, y: rect.top })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  aria-label={label}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
        <span>Less</span>
        {[0, 1, 2, 3].map(n => (
          <div key={n} className={`h-[12px] w-[12px] rounded-[2px] border ${cellColor(n)}`} />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg bg-[#1e2130] border border-[#2a2d3a] px-2.5 py-1.5 text-xs text-slate-200 shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 6 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
