'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { ContractScanRecord } from '@/types/stellar'
import { getAllScanHistory, clearScanHistory } from '@/lib/history'
import SeverityTrendChart from '@/components/SeverityTrendChart'
import SeverityBadge from '@/components/SeverityBadge'
import ThemeToggle from '@/components/ThemeToggle'
import { encodeFindings } from '@/lib/share'
import { getScoreColor } from '@/lib/score'

export default function HistoryClient() {
  const router = useRouter()
  const [history, setHistory] = useState<ContractScanRecord[]>([])
  const [selectedContract, setSelectedContract] = useState<string>('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const records = getAllScanHistory()
    setHistory(records)
    if (records.length > 0) {
      setSelectedContract(records[0].contractId)
    }
    setLoaded(true)
  }, [])

  // Unique list of contracts in history
  const contractIds = useMemo(() => {
    const set = new Set<string>()
    for (const r of history) {
      if (r.contractId) set.add(r.contractId)
    }
    return Array.from(set)
  }, [history])

  // Filter scan records for the selected contract (or all if selectedContract is 'all' or empty)
  const selectedRecords = useMemo(() => {
    if (!selectedContract) return history
    return history.filter(r => r.contractId === selectedContract)
  }, [history, selectedContract])

  function handleClearHistory() {
    clearScanHistory()
    setHistory([])
    setSelectedContract('')
  }

  function handleViewResult(record: ContractScanRecord) {
    if (record.findings && record.findings.length > 0) {
      const encoded = encodeFindings(record.findings as unknown as import('@/types/findings').Finding[])
      sessionStorage.setItem('sg_findings', JSON.stringify(record.findings))
      sessionStorage.setItem('sg_scan_source', record.contractId)
      router.push(`/results?r=${encoded}`)
    } else {
      router.push('/')
    }
  }

  if (!loaded) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-700/50"></div>
          <div className="h-48 w-full rounded-xl bg-slate-800/50"></div>
        </div>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 font-bold text-[var(--text)] hover:text-indigo-400 transition"
              aria-label="Return to home page"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span>Soroban Guard</span>
            </button>
            <span className="text-slate-500">/</span>
            <h1 className="text-lg font-semibold text-[var(--text)]">Scan History</h1>
          </div>

          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:border-red-500/40 transition"
                aria-label="Clear all scan history"
              >
                Clear history
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {history.length === 0 ? (
          <section aria-label="Empty scan history" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8 text-center">
            <h2 className="text-xl font-bold text-[var(--text)]">No Scan History Found</h2>
            <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
              Your recent smart contract security scans will be recorded here so you can track severity trends and changes over time.
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition"
            >
              Scan your first contract
            </button>
          </section>
        ) : (
          <div className="space-y-8">
            {/* Contract Picker dropdown if multiple contracts */}
            {contractIds.length > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                <label htmlFor="contract-select" className="text-sm font-medium text-slate-300">
                  Select Contract:
                </label>
                <select
                  id="contract-select"
                  value={selectedContract}
                  onChange={e => setSelectedContract(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Filter history by contract address"
                >
                  {contractIds.map(id => (
                    <option key={id} value={id}>
                      {id.length > 20 ? `${id.slice(0, 10)}…${id.slice(-8)}` : id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Severity Trend Chart Component (Option 1) */}
            <section aria-label="Contract severity trend visualization">
              <SeverityTrendChart
                records={selectedRecords}
                contractId={selectedContract || contractIds[0]}
              />
            </section>

            {/* History List */}
            <section aria-label="Scan history records list">
              <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">
                Scan Log ({selectedRecords.length})
              </h2>

              <div className="space-y-3">
                {selectedRecords.map(rec => (
                  <div
                    key={rec.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 transition hover:border-indigo-500/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-[var(--text)] break-all">
                          {rec.contractId}
                        </span>
                        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-400 capitalize">
                          {rec.network}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Scanned on {new Date(rec.scannedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Findings breakdown badges */}
                      <div className="flex items-center gap-2 text-xs">
                        {rec.highCount > 0 && (
                          <div className="flex items-center gap-1">
                            <SeverityBadge severity="High" size="sm" />
                            <span className="text-slate-300 font-mono">{rec.highCount}</span>
                          </div>
                        )}
                        {rec.mediumCount > 0 && (
                          <div className="flex items-center gap-1">
                            <SeverityBadge severity="Medium" size="sm" />
                            <span className="text-slate-300 font-mono">{rec.mediumCount}</span>
                          </div>
                        )}
                        {rec.lowCount > 0 && (
                          <div className="flex items-center gap-1">
                            <SeverityBadge severity="Low" size="sm" />
                            <span className="text-slate-300 font-mono">{rec.lowCount}</span>
                          </div>
                        )}
                        {rec.findingCount === 0 && (
                          <span className="text-emerald-400 font-medium">Clean Scan</span>
                        )}
                      </div>

                      {/* Score indicator */}
                      {typeof rec.score === 'number' && (
                        <div className={`text-sm font-bold ${getScoreColor(rec.score)}`}>
                          Score: {rec.score}
                        </div>
                      )}

                      <button
                        onClick={() => handleViewResult(rec)}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition"
                        aria-label={`View stored result for scan of ${rec.contractId} on ${new Date(rec.scannedAt).toLocaleDateString()}`}
                      >
                        View result →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
