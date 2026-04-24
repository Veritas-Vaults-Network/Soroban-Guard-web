'use client'

import { useEffect, useRef } from 'react'

interface Props {
  source: string
  highlightLine: number // 1-based
}

export default function CodeViewer({ source, highlightLine }: Props) {
  const lineRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    lineRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [highlightLine])

  const lines = source.split('\n')

  return (
    <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-[#2a2d3a] bg-[#0d0f17] text-xs">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, i) => {
            const lineNum = i + 1
            const isHighlight = lineNum === highlightLine
            return (
              <tr
                key={lineNum}
                ref={isHighlight ? lineRef : undefined}
                className={isHighlight ? 'bg-amber-500/15' : undefined}
              >
                <td
                  className="select-none px-3 py-0.5 text-right font-mono text-slate-600 w-10 shrink-0"
                  aria-hidden="true"
                >
                  {lineNum}
                </td>
                <td
                  className={`px-3 py-0.5 font-mono whitespace-pre ${
                    isHighlight ? 'text-amber-200' : 'text-slate-300'
                  }`}
                >
                  {line || ' '}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
