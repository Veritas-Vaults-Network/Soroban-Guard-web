'use client'

/**
 * Option 1: Severity trend over time for a single contract.
 *
 * Choice of Charting Approach:
 * Hand-written SVG is chosen over Recharts because it provides total control over DOM structure,
 * guarantees zero client bundle overhead, handles dark/light WCAG AA contrast seamlessly,
 * and allows embedding explicit SVG data marker shapes (circles, squares, triangles) alongside
 * a visually-hidden data table (`<table className="sr-only">`) to ensure full screen-reader accessibility
 * without needing DOM mutations or third-party chart workarounds.
 */

import React, { useId } from 'react'
import type { ContractScanRecord } from '@/types/stellar'

interface Props {
  records: ContractScanRecord[]
  contractId?: string
}

export default function SeverityTrendChart({ records, contractId }: Props) {
  const figureId = useId()

  // Sort chronologically (oldest to newest) for line chart plotting
  const chronologicalRecords = [...records].sort(
    (a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime()
  )

  const targetLabel = contractId
    ? `contract ${contractId.slice(0, 8)}…${contractId.slice(-6)}`
    : 'selected contract'

  if (records.length === 0) {
    return (
      <figure
        id={figureId}
        aria-label={`Severity trend over time for ${targetLabel}`}
        className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6"
      >
        <div className="text-center py-4">
          <h3 className="text-base font-semibold text-[var(--text)]">Severity Trend Over Time</h3>
          <p className="mt-2 text-sm text-slate-400">
            No scan history recorded for this contract yet. Run a scan to begin tracking security posture changes over time.
          </p>
        </div>
      </figure>
    )
  }

  // Calculate SVG dimensions and scale points
  const width = 600
  const height = 220
  const padding = { top: 30, right: 30, bottom: 45, left: 45 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxVal = Math.max(
    1,
    ...chronologicalRecords.map(r => Math.max(r.highCount, r.mediumCount, r.lowCount, r.findingCount))
  )

  const points = chronologicalRecords.map((r, i) => {
    const x =
      chronologicalRecords.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (i / (chronologicalRecords.length - 1)) * chartWidth
    const highY = padding.top + chartHeight - (r.highCount / maxVal) * chartHeight
    const medY = padding.top + chartHeight - (r.mediumCount / maxVal) * chartHeight
    const lowY = padding.top + chartHeight - (r.lowCount / maxVal) * chartHeight

    return {
      record: r,
      x,
      highY,
      medY,
      lowY,
      dateLabel: new Date(r.scannedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    }
  })

  const highPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.highY}`).join(' ')
  const medPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.medY}`).join(' ')
  const lowPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.lowY}`).join(' ')

  return (
    <figure
      id={figureId}
      aria-label={`Severity trend over time for ${targetLabel}`}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-[var(--text)]">Severity Trend Over Time</h3>
          {contractId && (
            <p className="font-mono text-xs text-slate-400">
              Contract: {contractId}
            </p>
          )}
        </div>

        {/* Legend with non-color shape indicators */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-red-400">
            <svg className="h-3 w-3" viewBox="0 0 10 10" aria-hidden="true">
              <circle cx="5" cy="5" r="4" fill="currentColor" />
            </svg>
            <span>High (Circle)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <svg className="h-3 w-3" viewBox="0 0 10 10" aria-hidden="true">
              <rect x="1" y="1" width="8" height="8" fill="currentColor" />
            </svg>
            <span>Medium (Square)</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-400">
            <svg className="h-3 w-3" viewBox="0 0 10 10" aria-hidden="true">
              <polygon points="5,1 9,9 1,9" fill="currentColor" />
            </svg>
            <span>Low (Triangle)</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-full h-auto text-[var(--text)]"
          role="img"
          aria-label={`Chart displaying security finding counts across ${records.length} scan${records.length === 1 ? '' : 's'}.`}
        >
          {/* Y-axis gridlines & labels */}
          {[0, 0.5, 1].map((pct, idx) => {
            const val = Math.round(maxVal * pct)
            const y = padding.top + chartHeight - pct * chartHeight
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.15}
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono"
                >
                  {val}
                </text>
              </g>
            )
          })}

          {/* Trend lines (if multiple points) */}
          {chronologicalRecords.length > 1 && (
            <>
              <path d={highPath} fill="none" stroke="#ef4444" strokeWidth="2.5" />
              <path d={medPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />
              <path d={lowPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="2 2" />
            </>
          )}

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx}>
              {/* X-axis tick label */}
              <text
                x={p.x}
                y={height - 12}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] font-mono"
              >
                {points.length > 6 ? `S${idx + 1}` : p.dateLabel}
              </text>

              {/* High Point - Circle */}
              <circle cx={p.x} cy={p.highY} r="4" fill="#ef4444">
                <title>{`Scan ${idx + 1}: ${p.record.highCount} High findings`}</title>
              </circle>

              {/* Medium Point - Square */}
              <rect x={p.x - 3.5} y={p.medY - 3.5} width="7" height="7" fill="#f59e0b">
                <title>{`Scan ${idx + 1}: ${p.record.mediumCount} Medium findings`}</title>
              </rect>

              {/* Low Point - Triangle */}
              <polygon
                points={`${p.x},${p.lowY - 4} ${p.x + 4},${p.lowY + 4} ${p.x - 4},${p.lowY + 4}`}
                fill="#3b82f6"
              >
                <title>{`Scan ${idx + 1}: ${p.record.lowCount} Low findings`}</title>
              </polygon>
            </g>
          ))}
        </svg>
      </div>

      {/* Visually-hidden screen reader equivalent table */}
      <table className="sr-only">
        <caption>
          Detailed security scan finding counts over time for {targetLabel}
        </caption>
        <thead>
          <tr>
            <th scope="col">Scan Number</th>
            <th scope="col">Date</th>
            <th scope="col">High Findings</th>
            <th scope="col">Medium Findings</th>
            <th scope="col">Low Findings</th>
            <th scope="col">Total Findings</th>
            <th scope="col">Score</th>
          </tr>
        </thead>
        <tbody>
          {chronologicalRecords.map((rec, i) => (
            <tr key={rec.id || i}>
              <td>{i + 1}</td>
              <td>{new Date(rec.scannedAt).toLocaleString()}</td>
              <td>{rec.highCount}</td>
              <td>{rec.mediumCount}</td>
              <td>{rec.lowCount}</td>
              <td>{rec.findingCount}</td>
              <td>{rec.score ?? 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
