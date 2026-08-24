'use client'

import React from 'react'
import { useWallet, normalizeNetworkName } from '@/lib/WalletContext'

interface WalletConnectProps {
  onSelectContract?: (contractId: string) => void
  compact?: boolean
}

export default function WalletConnect({ onSelectContract, compact = false }: WalletConnectProps) {
  const {
    connected,
    publicKey,
    walletNetwork,
    walletNetworkPassphrase,
    isInstalled,
    isConnecting,
    userRejected,
    error,
    deployedContracts,
    loadingContracts,
    networkMismatch,
    appNetwork,
    connectWallet,
    disconnectWallet,
    refreshContracts,
  } = useWallet()

  const truncatedKey = publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : ''
  const walletNormalizedNet = normalizeNetworkName(walletNetwork, walletNetworkPassphrase)

  if (!isInstalled) {
    return (
      <div className="flex flex-col gap-1">
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/40 transition hover:bg-indigo-600/30"
          aria-label="Install Freighter Wallet"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Install Freighter
        </a>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {connected ? (
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-400 border border-emerald-500/20">
              {truncatedKey}
            </span>
            <button
              onClick={disconnectWallet}
              className="rounded-md px-2 py-1 text-xs text-slate-400 hover:text-white transition"
              aria-label="Disconnect wallet"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            aria-label="Connect Freighter Wallet"
          >
            {isConnecting ? 'Connecting…' : 'Connect Wallet'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-left shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Freighter Wallet</h3>
            <p className="text-xs text-slate-400">
              {connected ? `Connected: ${truncatedKey}` : 'Connect your wallet to inspect deployed contracts'}
            </p>
          </div>
        </div>

        <div>
          {connected ? (
            <button
              onClick={disconnectWallet}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting…' : 'Connect Freighter'}
            </button>
          )}
        </div>
      </div>

      {userRejected && (
        <div role="status" className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Connection request was declined in Freighter.
        </div>
      )}

      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {networkMismatch && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 p-3 text-xs text-amber-200">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <span className="font-semibold">Network Mismatch:</span> Your wallet is set to{' '}
            <span className="font-mono uppercase text-amber-300">{walletNormalizedNet}</span>, but the app scanner is set to{' '}
            <span className="font-mono uppercase text-amber-300">{appNetwork.name}</span>. Switch your wallet or app network to match.
          </div>
        </div>
      )}

      {connected && (
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">
              Deployed Contracts ({deployedContracts.length})
            </span>
            <button
              onClick={refreshContracts}
              disabled={loadingContracts}
              className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
            >
              {loadingContracts ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {loadingContracts ? (
            <p className="text-xs text-slate-400 py-2">Loading contracts from Horizon…</p>
          ) : deployedContracts.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              No deployed contracts found on <span className="capitalize">{appNetwork.name}</span> for this account.
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {deployedContracts.map((contractId) => (
                <li
                  key={contractId}
                  className="flex items-center justify-between rounded-lg bg-[var(--bg-tertiary)] px-2.5 py-1.5 text-xs border border-[var(--border)]"
                >
                  <span className="font-mono text-slate-300">
                    {contractId.slice(0, 8)}...{contractId.slice(-8)}
                  </span>
                  {onSelectContract && (
                    <button
                      onClick={() => onSelectContract(contractId)}
                      className="rounded bg-indigo-600/30 px-2 py-1 text-[11px] font-medium text-indigo-300 transition hover:bg-indigo-600/50 hover:text-white"
                    >
                      Scan Contract
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
