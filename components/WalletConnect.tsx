'use client'

import { useEffect, useState } from 'react'
import { isFreighterInstalled } from '@/lib/wallet'
import { useWallet } from '@/lib/WalletContext'
import ContractIdBadge from '@/components/ContractIdBadge'

export default function WalletConnect() {
  const { publicKey, network, connect, disconnect } = useWallet()
  const [installed, setInstalled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setInstalled(isFreighterInstalled())
  }, [])

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const result = await connect()
      if (!result) setError('Could not retrieve public key. Make sure Freighter is unlocked.')
    } catch {
      setError('Failed to connect to Freighter.')
    } finally {
      setLoading(false)
    }
  }

  function handleDisconnect() {
    disconnect()
    setError(null)
  }

  if (!installed) {
    return (
      <a
        href="https://freighter.app"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg border border-[#2a2d3a] bg-[#12151f] px-4 py-2 text-sm text-slate-400 transition hover:border-indigo-500/40 hover:text-slate-200"
      >
        <StellarIcon />
        Install Freighter
      </a>
    )
  }

  if (publicKey) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <ContractIdBadge id={publicKey} className="text-xs text-emerald-400" />
          {network && (
            <span className="rounded-full bg-[#1a1d27] px-1.5 py-0.5 text-xs text-slate-500">
              {network.name}
            </span>
          )}
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg border border-[#2a2d3a] bg-[#12151f] px-4 py-2 text-sm text-slate-300 transition hover:border-indigo-500/40 hover:text-white disabled:opacity-50"
      >
        {loading ? (
          <svg className="spinner h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        ) : (
          <StellarIcon />
        )}
        {loading ? 'Connecting…' : 'Connect Freighter'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function StellarIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 13.5l-9-4.5 9-4.5v9z" />
    </svg>
  )
}
