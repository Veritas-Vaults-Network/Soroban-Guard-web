'use client'

import { useState } from 'react'
import { useToast } from '@/lib/toast'

const NETWORKS = ['testnet', 'mainnet', 'futurenet'] as const
type Network = (typeof NETWORKS)[number]

function badgeUrl(status: 'passing' | 'warnings' | 'failing') {
  const colors = { passing: 'brightgreen', warnings: 'yellow', failing: 'red' }
  return `https://img.shields.io/badge/Soroban%20Guard-${status}-${colors[status]}`
}

export default function BadgePage() {
  const { show } = useToast()
  const [contractId, setContractId] = useState('')
  const [network, setNetwork] = useState<Network>('testnet')
  const [status, setStatus] = useState<'passing' | 'warnings' | 'failing'>('passing')

  const imgUrl = badgeUrl(status)
  const markdown = contractId.trim()
    ? `[![Soroban Guard](${imgUrl})](https://soroban-guard.veritas-vaults.network/?contractId=${encodeURIComponent(contractId.trim())}&network=${network})`
    : `[![Soroban Guard](${imgUrl})](https://soroban-guard.veritas-vaults.network)`

  function handleCopy() {
    navigator.clipboard.writeText(markdown).then(() => show('Markdown copied!', 'success'))
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-white">Scan Badge Generator</h1>
      <p className="mb-8 text-sm text-slate-400">
        Generate a shields.io badge to display in your README.
      </p>

      <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
        <div>
          <label htmlFor="contractId" className="mb-1.5 block text-xs font-medium text-slate-400">
            Contract ID <span className="text-slate-600">(optional)</span>
          </label>
          <input
            id="contractId"
            type="text"
            value={contractId}
            onChange={e => setContractId(e.target.value.trim().toUpperCase())}
            placeholder="CABC…XYZ"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            spellCheck={false}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="network" className="mb-1.5 block text-xs font-medium text-slate-400">Network</label>
            <select
              id="network"
              value={network}
              onChange={e => setNetwork(e.target.value as Network)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="status" className="mb-1.5 block text-xs font-medium text-slate-400">Badge status</label>
            <select
              id="status"
              value={status}
              onChange={e => setStatus(e.target.value as typeof status)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="passing">passing</option>
              <option value="warnings">warnings</option>
              <option value="failing">failing</option>
            </select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-slate-400">Preview</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt="Soroban Guard badge preview" />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-400">Markdown snippet</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-slate-300 whitespace-nowrap">
              {markdown}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-slate-400 transition hover:text-white"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
