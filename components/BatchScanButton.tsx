'use client'

import { useState, useRef } from 'react'
import { fetchContractsByAccount } from '@/lib/stellar'
import { scanContract } from '@/lib/api'
import { addScanRecord } from '@/lib/history'
import ScanProgress from './ScanProgress'
import type { Finding } from '@/types/findings'
import type { StellarNetwork } from '@/types/stellar'

interface Props {
  publicKey: string
  network: StellarNetwork
  /** Optional extra contract IDs to include alongside wallet contracts */
  extraContractIds?: string[]
  /** Called when all scans finish, with aggregated findings */
  onComplete?: (results: BatchResult[]) => void
}

export interface BatchResult {
  contractId: string
  findings: Finding[]
  error?: string
}

type BatchState = 'idle' | 'fetching' | 'scanning' | 'done' | 'error'

export default function BatchScanButton({ publicKey, network, extraContractIds = [], onComplete }: Props) {
  const [state, setState] = useState<BatchState>('idle')
  const [contracts, setContracts] = useState<string[]>([])
  const [current, setCurrent] = useState(0)
  const [results, setResults] = useState<BatchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState('')
  const cancelledRef = useRef(false)

  async function handleStart() {
    cancelledRef.current = false
    setState('fetching')
    setError(null)
    setResults([])

    let walletIds: string[] = []
    try {
      walletIds = await fetchContractsByAccount(publicKey, network)
    } catch (e) {
      // Non-fatal: fall through to manual/extra IDs
    }

    // Merge wallet contracts + extra IDs + manual input, deduplicated
    const manualIds = manualInput
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)

    const ids = Array.from(new Set([...walletIds, ...extraContractIds, ...manualIds]))

    if (ids.length === 0) {
      setError('No contracts found. Enter contract IDs manually or connect a wallet.')
      setState('error')
      return
    }

    setContracts(ids)
    setState('scanning')
    setCurrent(0)

    const accumulated: BatchResult[] = []

    for (let i = 0; i < ids.length; i++) {
      if (cancelledRef.current) break
      setCurrent(i + 1)
      try {
        const result = await scanContract(ids[i], network)
        const findings = result.findings as Finding[]
        addScanRecord(publicKey, ids[i], network.name, findings)
        accumulated.push({ contractId: ids[i], findings })
      } catch (e) {
        accumulated.push({
          contractId: ids[i],
          findings: [],
          error: e instanceof Error ? e.message : 'Scan failed',
        })
      }
      setResults([...accumulated])
    }

    if (!cancelledRef.current) {
      setState('done')
      onComplete?.(accumulated)
    }
  }

  function handleCancel() {
    cancelledRef.current = true
    setState('idle')
    setCurrent(0)
    setContracts([])
    setResults([])
  }

  const totalFindings = results.reduce((sum, r) => sum + r.findings.length, 0)
  const failedCount = results.filter(r => r.error).length

  if (state === 'idle' || state === 'error') {
    return (
      <div className="flex flex-col gap-3">
        {/* Manual contract ID input */}
        <textarea
          value={manualInput}
          onChange={e => setManualInput(e.target.value)}
          placeholder="Paste contract IDs (one per line or comma-separated) — optional"
          rows={3}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <button
          onClick={handleStart}
          className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/20"
        >
          Scan all my contracts
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }

  if (state === 'fetching') {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <svg className="h-4 w-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
        </svg>
        Fetching your contracts…
      </div>
    )
  }

  if (state === 'scanning') {
    return (
      <div className="space-y-3">
        <ScanProgress loading batchCurrent={current} batchTotal={contracts.length} />
        <button
          onClick={handleCancel}
          className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
        >
          Cancel
        </button>
      </div>
    )
  }

  // done — show aggregated summary
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-green-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span>
          Scanned {contracts.length} contract{contracts.length !== 1 ? 's' : ''} —{' '}
          {totalFindings} finding{totalFindings !== 1 ? 's' : ''} total
          {failedCount > 0 && (
            <span className="ml-1 text-red-400">({failedCount} failed)</span>
          )}
        </span>
      </div>

      {/* Per-contract summary */}
      <ul className="space-y-1.5 max-h-48 overflow-y-auto">
        {results.map(r => (
          <li key={r.contractId} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs">
            <span className="truncate font-mono text-slate-400 max-w-[60%]">{r.contractId}</span>
            {r.error ? (
              <span className="text-red-400">{r.error}</span>
            ) : (
              <span className={r.findings.length > 0 ? 'text-amber-400' : 'text-green-400'}>
                {r.findings.length} finding{r.findings.length !== 1 ? 's' : ''}
              </span>
            )}
          </li>
        ))}
      </ul>

      <button
        onClick={() => { setState('idle'); setContracts([]); setCurrent(0); setResults([]) }}
        className="text-xs text-slate-500 hover:text-slate-300 transition"
      >
        Dismiss
      </button>
    </div>
  )
}
