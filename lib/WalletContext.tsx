'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as freighterApi from '@stellar/freighter-api'
import { NETWORKS, type StellarNetwork } from '@/types/stellar'
import { fetchContractsByAccount } from '@/lib/stellar'

export interface WalletContextType {
  connected: boolean
  publicKey: string | null
  walletNetwork: string | null
  walletNetworkPassphrase: string | null
  isInstalled: boolean
  isConnecting: boolean
  userRejected: boolean
  error: string | null
  deployedContracts: string[]
  loadingContracts: boolean
  networkMismatch: boolean
  appNetwork: StellarNetwork
  setAppNetwork: (network: StellarNetwork) => void
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  refreshContracts: () => Promise<void>
  clearError: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: React.ReactNode
  initialNetwork?: StellarNetwork
}

export function normalizeNetworkName(network: string | null | undefined, passphrase?: string | null): string {
  if (!network && !passphrase) return 'unknown'
  const net = (network || '').toLowerCase()
  const pass = (passphrase || '').toLowerCase()

  if (net.includes('public') || net.includes('main') || pass.includes('public global')) {
    return 'mainnet'
  }
  if (net.includes('test') || pass.includes('test sdf network')) {
    return 'testnet'
  }
  if (net.includes('future') || pass.includes('october 2022')) {
    return 'futurenet'
  }
  return net || 'unknown'
}

export function WalletProvider({ children, initialNetwork = NETWORKS.testnet }: WalletProviderProps) {
  const [appNetwork, setAppNetworkState] = useState<StellarNetwork>(initialNetwork)
  const [connected, setConnected] = useState<boolean>(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [walletNetwork, setWalletNetwork] = useState<string | null>(null)
  const [walletNetworkPassphrase, setWalletNetworkPassphrase] = useState<string | null>(null)
  const [isInstalled, setIsInstalled] = useState<boolean>(true)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [userRejected, setUserRejected] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [deployedContracts, setDeployedContracts] = useState<string[]>([])
  const [loadingContracts, setLoadingContracts] = useState<boolean>(false)

  // Check if Freighter extension is available in window / freighter-api
  const checkInstalled = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window !== 'undefined' && (window as unknown as { freighter?: unknown }).freighter) {
        const mockWin = window as unknown as { freighter?: { isConnected: () => Promise<boolean> } }
        if (mockWin.freighter?.isConnected) {
          const res = await mockWin.freighter.isConnected()
          setIsInstalled(Boolean(res))
          return Boolean(res)
        }
      }
      const res = await freighterApi.isConnected()
      const installed = typeof res === 'boolean' ? res : Boolean(res?.isConnected)
      setIsInstalled(installed)
      return installed
    } catch {
      setIsInstalled(false)
      return false
    }
  }, [])

  const setAppNetwork = useCallback((net: StellarNetwork) => {
    setAppNetworkState(net)
  }, [])

  // Network mismatch check
  const walletNormalized = normalizeNetworkName(walletNetwork, walletNetworkPassphrase)
  const networkMismatch = connected && walletNormalized !== 'unknown' && walletNormalized !== appNetwork.name

  // Fetch deployed contracts for account (read-only, no signature required)
  const fetchContracts = useCallback(
    async (pk: string, net: StellarNetwork) => {
      setLoadingContracts(true)
      try {
        const contracts = await fetchContractsByAccount(pk, net)
        setDeployedContracts(contracts)
      } catch {
        setDeployedContracts([])
      } finally {
        setLoadingContracts(false)
      }
    },
    []
  )

  const refreshContracts = useCallback(async () => {
    if (connected && publicKey) {
      await fetchContracts(publicKey, appNetwork)
    }
  }, [connected, publicKey, appNetwork, fetchContracts])

  // Connect wallet handler
  const connectWallet = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    setUserRejected(false)

    try {
      const installed = await checkInstalled()
      if (!installed) {
        setIsConnecting(false)
        return
      }

      let key: string | null = null
      let netName: string | null = null
      let netPass: string | null = null

      // Window freighter mock or direct extension API fallback
      const mockWin = typeof window !== 'undefined'
        ? (window as unknown as { freighter?: {
            getPublicKey?: () => Promise<string>
            getNetwork?: () => Promise<string>
            getNetworkDetails?: () => Promise<{ networkPassphrase?: string; networkUrl?: string; network?: string }>
          } })
        : null

      if (mockWin?.freighter?.getPublicKey) {
        key = await mockWin.freighter.getPublicKey()
        if (mockWin.freighter.getNetwork) {
          netName = await mockWin.freighter.getNetwork()
        }
        if (mockWin.freighter.getNetworkDetails) {
          const details = await mockWin.freighter.getNetworkDetails()
          netPass = details.networkPassphrase ?? null
          if (!netName && details.network) netName = details.network
        }
      } else {
        // Use freighterApi
        if (freighterApi.requestAccess) {
          const accessRes = await freighterApi.requestAccess()
          if (typeof accessRes === 'string') {
            key = accessRes
          } else if (accessRes && typeof accessRes === 'object') {
            const typed = accessRes as { address?: string; error?: string }
            if (typed.error) {
              throw new Error(typed.error)
            }
            key = typed.address ?? null
          }
        } else if (freighterApi.getAddress) {
          const addrRes = await freighterApi.getAddress()
          if (typeof addrRes === 'string') {
            key = addrRes
          } else if (addrRes && typeof addrRes === 'object') {
            const typed = addrRes as { address?: string; error?: string }
            if (typed.error) throw new Error(typed.error)
            key = typed.address ?? null
          }
        }

        if (freighterApi.getNetwork) {
          const netRes = await freighterApi.getNetwork()
          netName = typeof netRes === 'string' ? netRes : (netRes as { network?: string })?.network ?? null
        }
        if (freighterApi.getNetworkDetails) {
          const detailsRes = await freighterApi.getNetworkDetails()
          if (detailsRes && typeof detailsRes === 'object') {
            const details = detailsRes as { networkPassphrase?: string; network?: string }
            netPass = details.networkPassphrase ?? null
            if (!netName && details.network) netName = details.network
          }
        }
      }

      if (!key) {
        throw new Error('No public key returned')
      }

      setPublicKey(key)
      setWalletNetwork(netName)
      setWalletNetworkPassphrase(netPass)
      setConnected(true)
      setUserRejected(false)

      await fetchContracts(key, appNetwork)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const isRejection =
        msg.toLowerCase().includes('decline') ||
        msg.toLowerCase().includes('reject') ||
        msg.toLowerCase().includes('deni') ||
        msg.toLowerCase().includes('cancel') ||
        msg.toLowerCase().includes('user denied')

      if (isRejection) {
        setUserRejected(true)
        setConnected(false)
        setPublicKey(null)
        setError(null)
      } else {
        setError(msg)
        setConnected(false)
        setPublicKey(null)
      }
    } finally {
      setIsConnecting(false)
    }
  }, [checkInstalled, appNetwork, fetchContracts])

  const disconnectWallet = useCallback(() => {
    setConnected(false)
    setPublicKey(null)
    setWalletNetwork(null)
    setWalletNetworkPassphrase(null)
    setDeployedContracts([])
    setUserRejected(false)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-refetch deployed contracts when appNetwork changes while connected
  useEffect(() => {
    if (connected && publicKey) {
      fetchContracts(publicKey, appNetwork)
    }
  }, [appNetwork, connected, publicKey, fetchContracts])

  // Watch for account/network changes in Freighter
  useEffect(() => {
    let watchUnsub: (() => void) | undefined

    if (typeof window !== 'undefined' && freighterApi.WatchWalletChanges) {
      try {
        const watcher = new freighterApi.WatchWalletChanges()
        watcher.watch(async () => {
          if (connected && publicKey) {
            try {
              let newKey: string | null = null
              let newNet: string | null = null
              const mockWin = window as unknown as { freighter?: { getPublicKey?: () => Promise<string>; getNetwork?: () => Promise<string> } }
              if (mockWin.freighter?.getPublicKey) {
                newKey = await mockWin.freighter.getPublicKey()
                if (mockWin.freighter.getNetwork) newNet = await mockWin.freighter.getNetwork()
              } else if (freighterApi.getAddress) {
                const res = await freighterApi.getAddress()
                newKey = typeof res === 'string' ? res : (res as { address?: string })?.address ?? null
                const netRes = await freighterApi.getNetwork()
                newNet = typeof netRes === 'string' ? netRes : (netRes as { network?: string })?.network ?? null
              }
              if (newKey && newKey !== publicKey) {
                setPublicKey(newKey)
                fetchContracts(newKey, appNetwork)
              }
              if (newNet && newNet !== walletNetwork) {
                setWalletNetwork(newNet)
              }
            } catch {
              // Ignore background update errors
            }
          }
        })
        watchUnsub = () => watcher.stop()
      } catch {
        // Fallback if watcher unsupported
      }
    }

    return () => {
      if (watchUnsub) watchUnsub()
    }
  }, [connected, publicKey, walletNetwork, appNetwork, fetchContracts])

  // Initial check on mount
  useEffect(() => {
    checkInstalled()
  }, [checkInstalled])

  return (
    <WalletContext.Provider
      value={{
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
        setAppNetwork,
        connectWallet,
        disconnectWallet,
        refreshContracts,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
