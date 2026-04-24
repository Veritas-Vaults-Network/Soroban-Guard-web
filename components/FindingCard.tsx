'use client'

import { useState, useEffect } from 'react'
import type { Finding } from '@/types/findings'
import SeverityBadge from './SeverityBadge'
import CheckTooltip from './CheckTooltip'
import CodeViewer from './CodeViewer'
import { loadSourceCode } from '@/lib/codeStore'

interface Props {
  finding: Finding
}

export default function FindingCard({ finding }: Props) {
  const [showCode, setShowCode] = useState(false)
  const [source, setSource] = useState<string | null>(null)

  useEffect(() => {
    setSource(loadSourceCode())
  }, [])

  return (
    <div className="slide-down rounded-lg border border-[#2a2d3a] bg-[#12151f] p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SeverityBadge severity={finding.severity} />
        <CheckTooltip checkName={finding.check_name} />
      </div>

      <p className="mb-5 text-sm leading-relaxed text-slate-300">
        {finding.description}
      </p>

      {finding.remediation && (
        <div className="mb-5 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
          <p className="mb-1 text-xs font-semibold text-green-400">Remediation</p>
          <p className="text-sm leading-relaxed text-green-300/90">
            {finding.remediation}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Detail label="Function" value={finding.function_name} mono />
        <Detail label="File" value={finding.file_path} mono />
        <Detail label="Line" value={String(finding.line)} mono />
      </div>

      {source && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowCode(v => !v)}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            aria-expanded={showCode}
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${showCode ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {showCode ? 'Hide code' : 'View in code'}
          </button>
          {showCode && <CodeViewer source={source} highlightLine={finding.line} />}
        </div>
      )}

      <div className="mt-4 text-right">
        <a
          href={`https://github.com/Veritas-Vaults-Network/soroban-guard-core/issues/new?title=${encodeURIComponent(`False positive: ${finding.check_name}`)}&body=${encodeURIComponent(finding.description)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Report false positive
        </a>
      </div>
    </div>
  )
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-md bg-[#1a1d27] px-3 py-2">
      <p className="mb-0.5 text-xs text-slate-500">{label}</p>
      <p
        className={`truncate text-sm text-slate-200 ${mono ? 'font-mono' : ''}`}
        title={value}
      >
        {value}
      </p>
    </div>
  )
}
