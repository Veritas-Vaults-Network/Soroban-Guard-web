'use client'

import { useState, useRef } from 'react'
import { fetchContractsByAccount } from '@/lib/stellar'
import { scanContract } from '@/lib/api'
import { addScanRecord } from '@/lib/history'
import type { StellarNetwork } from '@/types/stellar'

interface Props {
  publicKey: string
  network: StellarNetwork
}

type BatchState = 'idle' | 'fetching' | 'scanning' | 'done' | 'error'

export default function BatchScanButton({ publicKey, network }: Props) {
  const [state, setState] = useState<BatchState>('idle')
  const [contracts, setContracts] = useState<string[]>([])
  const [current, setCurrent] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  async function handleStart() {
    cancelledRef.current = false
    setState('fetching')
    setError(null)

    let ids: string[]
    try {
      ids = await fetchContractsByAccount(publicKey, network)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch contracts')
      setState('error')
      return
    }

    if (ids.length === 0) {
      setError('No contracts found for this account.')
      setState('error')
      return
    }

    setContracts(ids)
    setState('scanning')

    for (let i = 0; i < ids.length; i++) {
      if (cancelledRef.current) break
      setCurrent(i + 1)
      try {
        const result = await scanContract(ids[i], network)
        addScanRecord(publicKey, ids[i], network.name, result.findings as any)
      } catch {
        // Continue scanning remaining contracts even if one fails
      }
    }

    if (!cancelledRef.current) setState('done')
  }

  function handleCancel() {
    cancelledRef.current = true
    setState('idle')
    setCurrent(0)
    setContracts([])
  }

  if (state === 'idle' || state === 'error') {
    return (
      <div className="flex flex-col gap-2">
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
      <div className="flex items-center gap-3">
        <svg className="h-4 w-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
        </svg>
        <span className="text-sm text-slate-300">
          Scanning contract {current} of {contracts.length}…
        </span>
        <button
          onClick={handleCancel}
          className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
        >
          Cancel
        </button>
      </div>
    )
  }

  // done
  return (
    <div className="flex items-center gap-2 text-sm text-green-400">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Scanned {contracts.length} contract{contracts.length !== 1 ? 's' : ''}. Results saved to history.
      <button onClick={() => { setState('idle'); setContracts([]); setCurrent(0) }} className="ml-2 text-xs text-slate-500 hover:text-slate-300">
        Dismiss
      </button>
    </div>
  )
}
