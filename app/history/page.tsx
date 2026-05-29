'use client'

 feat/history-filter-input
import { useEffect, useMemo, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import WalletConnect from '@/components/WalletConnect'
import NetworkBadge from '@/components/NetworkBadge'
import { getScanHistory } from '@/lib/history'
import { NETWORKS } from '@/types/stellar'
import type { ContractScanRecord, StellarNetwork } from '@/types/stellar'

export default function HistoryPage() {
  const [walletKey, setWalletKey] = useState<string | null>(null)
  const [walletNetwork, setWalletNetwork] = useState<StellarNetwork | null>(null)
  const [scanHistory, setScanHistory] = useState<ContractScanRecord[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!walletKey) return
    setScanHistory(getScanHistory(walletKey))
  }, [walletKey])

  const normalizedFilter = filter.trim().toLowerCase()

  const filteredHistory = useMemo(
    () =>
      scanHistory.filter(record => {
        if (!normalizedFilter) return true

        const contractId = record.contractId.toLowerCase()
        const scannedDate = new Date(record.scannedAt).toLocaleDateString().toLowerCase()

        return (
          contractId.includes(normalizedFilter) ||
          scannedDate.includes(normalizedFilter)
        )
      }),
    [normalizedFilter, scanHistory],
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Soroban Guard</p>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Scan history</h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="rounded-lg border border-[#2a2d3a] bg-[#12151f] px-4 py-2 text-sm text-slate-300 transition hover:border-indigo-500/40 hover:text-white"
            >
              Home
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-2xl">
          <div className="mb-6 space-y-3">
            <h2 className="text-xl font-semibold text-white">Filter your scan history</h2>
            <p className="text-sm text-slate-400">
              Connect your wallet to load saved scans, then search by contract ID or scanned date.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              {walletKey ? (
                <div className="rounded-2xl border border-[#2a2d3a] bg-[#12151f] p-4">
                  <p className="text-sm text-slate-400">Connected wallet</p>
                  <p className="font-mono text-sm text-slate-200">
                    {walletKey.slice(0, 6)}…{walletKey.slice(-4)}
                  </p>
                  {walletNetwork ? (
                    <div className="mt-3 inline-flex items-center gap-2">
                      <NetworkBadge network={NETWORKS[walletNetwork.name]} />
                      <span className="text-xs text-slate-500">{walletNetwork.name}</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#2a2d3a] bg-[#12151f] p-4 text-slate-400">
                  Connect Freighter to show contract scan history saved for your wallet.
                </div>
              )}

              <WalletConnect
                onConnect={(publicKey, network) => {
                  setWalletKey(publicKey)
                  setWalletNetwork(network)
                }}
              />
            </div>

            <div>
              <label htmlFor="history-search" className="mb-2 block text-sm font-medium text-slate-300">
                Search contracts or dates
              </label>
              <input
                id="history-search"
                type="search"
                value={filter}
                onChange={event => setFilter(event.target.value)}
                placeholder="Filter by contract ID or date"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          <div className="mt-8">
            {walletKey ? (
              scanHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#2a2d3a] bg-[#12151f] p-8 text-center text-slate-400">
                  No scan history found for this wallet yet.
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#2a2d3a] bg-[#12151f] p-8 text-center text-slate-400">
                  No matching history records. Try a different contract ID or date.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((record, index) => (
                    <div
                      key={`${record.contractId}-${record.scannedAt}-${index}`}
                      className="rounded-3xl border border-[#2a2d3a] bg-[#0f1220] p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-mono text-sm text-slate-200 break-all">
                            {record.contractId}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            Scanned {new Date(record.scannedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="rounded-full border border-slate-700 bg-slate-950/40 px-2 py-1">
                            {record.findingCount} findings
                          </span>
                          {record.highCount > 0 && (
                            <span className="rounded-full bg-red-500/10 px-2 py-1 text-red-300">
                              {record.highCount} high
                            </span>
                          )}
                          {record.mediumCount > 0 && (
                            <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">
                              {record.mediumCount} medium
                            </span>
                          )}
                          {record.lowCount > 0 && (
                            <span className="rounded-full bg-sky-500/10 px-2 py-1 text-sky-300">
                              {record.lowCount} low
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-slate-600">
        Soroban Guard · Veritas Vaults Network
      </footer>

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Finding } from '@/types/findings'
import ConfirmModal from '@/components/ConfirmModal'
import SeverityTrendChart from '@/components/SeverityTrendChart'
import ScanHeatmap from '@/components/ScanHeatmap'
import {
  addSchedule,
  removeSchedule,
  getSchedule,
  type ScheduleInterval,
} from '@/lib/schedule'

interface HistoryEntry {
  id: string
  date: string
  source: string
  findings: Finding[]
}

const STORAGE_KEY = 'sg_history'

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  // Track schedule state per entry id
  const [schedules, setSchedules] = useState<Record<string, ScheduleInterval | null>>({})

  useEffect(() => {
    const loaded = loadHistory()
    setEntries(loaded)
    // Load existing schedules for each entry
    const initial: Record<string, ScheduleInterval | null> = {}
    for (const e of loaded) {
      const s = getSchedule(e.source, 'testnet')
      initial[e.id] = s?.interval ?? null
    }
    setSchedules(initial)
  }, [])

  function clearHistory() {
    localStorage.removeItem(STORAGE_KEY)
    setEntries([])
    setShowConfirm(false)
  }

  function handleScheduleChange(entry: HistoryEntry, interval: ScheduleInterval | 'never') {
    if (interval === 'never') {
      removeSchedule(entry.source, 'testnet')
      setSchedules(prev => ({ ...prev, [entry.id]: null }))
    } else {
      addSchedule(entry.source, 'testnet', interval)
      setSchedules(prev => ({ ...prev, [entry.id]: interval }))
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Scan History</h1>
        <div className="flex items-center gap-3">
          <a
            href="/analytics"
            className="rounded-lg border border-[#2a2d3a] px-4 py-2 text-sm text-slate-400 transition hover:text-white"
          >
            Analytics
          </a>
          {entries.length > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
            >
              Clear history
            </button>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No scan history yet.</p>
      ) : (
        <>
          {entries.length >= 7 && (
            <div className="mb-6">
              <ScanHeatmap entries={entries.map(e => ({ date: e.date }))} />
            </div>
          )}
          {entries.length >= 2 && (
            <div className="mb-6">
              <SeverityTrendChart
                data={entries.map(e => ({
                  date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                  High: e.findings.filter(f => f.severity === 'High').length,
                  Medium: e.findings.filter(f => f.severity === 'Medium').length,
                  Low: e.findings.filter(f => f.severity === 'Low').length,
                }))}
              />
            </div>
          )}
          <ul className="space-y-3">
            {entries.map(e => (
              <li
                key={e.id}
                className="rounded-xl border border-[#2a2d3a] bg-[#12151f] px-5 py-4"
              >
                <div className="flex items-center justify-between">
                  <span className="truncate font-mono text-sm text-slate-300">{e.source}</span>
                  <span className="ml-4 shrink-0 text-xs text-slate-500">
                    {new Date(e.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {e.findings.length} finding{e.findings.length !== 1 ? 's' : ''}
                </p>
                {/* Schedule rescan toggle */}
                <div className="mt-3 flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-slate-500">Rescan:</span>
                  {(['never', 'daily', 'weekly'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleScheduleChange(e, opt)}
                      className={`rounded-md px-2 py-0.5 text-xs font-medium transition ${
                        (opt === 'never' && !schedules[e.id]) || schedules[e.id] === opt
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {showConfirm && (
        <ConfirmModal
          title="Clear all history?"
          description="This will permanently delete all scan records from this browser. This cannot be undone."
          confirmLabel="Clear history"
          onConfirm={clearHistory}
          onCancel={() => setShowConfirm(false)}
        />
      )}
 main
    </div>
  )
}
