'use client'

import { useState } from 'react'
import type { Finding } from '@/types/findings'
import FindingsTable from './FindingsTable'

interface Props {
  groupedFindings: Record<string, Finding[]>
  onMuteChange?: () => void
}

export default function FindingsByFile({ groupedFindings, onMuteChange }: Props) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())

  function toggleFile(filePath: string) {
    setExpandedFiles((prev: Set<string>) => {
      const next = new Set(prev)
      if (next.has(filePath)) {
        next.delete(filePath)
      } else {
        next.add(filePath)
      }
      return next
    })
  }

  const filePaths = Object.keys(groupedFindings).sort()

  return (
    <div className="space-y-3">
      {filePaths.map(filePath => {
        const findings = groupedFindings[filePath]
        const isExpanded = expandedFiles.has(filePath)
        
        return (
          <div key={filePath} className="overflow-hidden rounded-xl border border-[var(--border)]">
            {/* File header */}
            <button
              onClick={() => toggleFile(filePath)}
              className="flex w-full items-center justify-between bg-[var(--bg-tertiary)] px-5 py-4 text-left transition-colors hover:bg-[var(--bg-hover)]"
              aria-expanded={isExpanded}
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-mono text-sm text-slate-200">{filePath}</span>
              </div>
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
                {findings.length} finding{findings.length !== 1 ? 's' : ''}
              </span>
            </button>

            {/* File findings */}
            {isExpanded && (
              <div className="border-t border-[var(--border)]">
                <FindingsTable findings={findings} pageSize={50} onMuteChange={onMuteChange} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
