'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Finding, Severity } from '@/types/findings'
import FindingsTable from '@/components/FindingsTable'
import EmptyState from '@/components/EmptyState'
import SeverityBadge from '@/components/SeverityBadge'

export default function ResultsPage() {
  const router = useRouter()
  const [findings, setFindings] = useState<Finding[] | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('sg_findings')
    if (!raw) {
      router.replace('/')
      return
    }
    try {
      setFindings(JSON.parse(raw) as Finding[])
    } catch {
      router.replace('/')
    }
  }, [router])

  function handleScanAnother() {
    sessionStorage.removeItem('sg_findings')
    router.push('/')
  }

  if (findings === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <svg className="spinner h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      </div>
    )
  }

  const counts: Record<Severity, number> = { High: 0, Medium: 0, Low: 0 }
  for (const f of findings) counts[f.severity]++

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b border-[#2a2d3a] bg-[#0f1117]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={handleScanAnother}
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Soroban Guard
          </button>
          <button
            onClick={handleScanAnother}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Scan another contract
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {/* Summary bar */}
        <div className="mb-8">
          <h1 className="mb-1 text-2xl font-bold text-white">Scan Results</h1>
          <p className="mb-6 text-sm text-slate-500">
            {findings.length === 0
              ? 'No issues detected.'
              : `${findings.length} finding${findings.length !== 1 ? 's' : ''} detected across your contract.`}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard
              label="Total Findings"
              value={findings.length}
              color="text-white"
              bg="bg-[#1a1d27]"
            />
            <SummaryCard
              label="High"
              value={counts.High}
              color="text-red-400"
              bg="bg-red-500/5"
              border="border-red-500/20"
            />
            <SummaryCard
              label="Medium"
              value={counts.Medium}
              color="text-amber-400"
              bg="bg-amber-500/5"
              border="border-amber-500/20"
            />
            <SummaryCard
              label="Low"
              value={counts.Low}
              color="text-sky-400"
              bg="bg-sky-500/5"
              border="border-sky-500/20"
            />
          </div>
        </div>

        {/* Findings or empty state */}
        {findings.length === 0 ? (
          <EmptyState onScanAnother={handleScanAnother} />
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-400">
                Findings — click a row to expand details
              </h2>
              <div className="flex gap-2">
                {(['High', 'Medium', 'Low'] as Severity[]).map(s =>
                  counts[s] > 0 ? (
                    <SeverityBadge key={s} severity={s} size="sm" />
                  ) : null,
                )}
              </div>
            </div>
            {/* Sort: High → Medium → Low */}
            <FindingsTable
              findings={[...findings].sort((a, b) => {
                const order: Record<Severity, number> = { High: 0, Medium: 1, Low: 2 }
                return order[a.severity] - order[b.severity]
              })}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-[#2a2d3a] py-6 text-center text-xs text-slate-600">
        Soroban Guard · Veritas Vaults Network
      </footer>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  color,
  bg,
  border = 'border-[#2a2d3a]',
}: {
  label: string
  value: number
  color: string
  bg: string
  border?: string
}) {
  return (
    <div className={`rounded-xl border ${border} ${bg} px-5 py-4`}>
      <p className="mb-1 text-xs text-slate-500">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
