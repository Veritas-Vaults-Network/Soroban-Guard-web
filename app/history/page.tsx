'use client'

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
    </div>
  )
}
