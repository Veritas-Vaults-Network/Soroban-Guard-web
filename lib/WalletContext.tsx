'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { connectFreighter, getFreighterNetwork } from '@/lib/wallet'
import { NETWORKS } from '@/types/stellar'
import type { StellarNetwork } from '@/types/stellar'

interface WalletContextValue {
  publicKey: string | null
  network: StellarNetwork
  connect: () => Promise<{ publicKey: string; network: StellarNetwork } | null>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [network, setNetwork] = useState<StellarNetwork>(NETWORKS.testnet)

  const connect = useCallback(async () => {
    const key = await connectFreighter()
    if (!key) return null
    const net = (await getFreighterNetwork()) ?? NETWORKS.testnet
    setPublicKey(key)
    setNetwork(net)
    return { publicKey: key, network: net }
  }, [])

  const disconnect = useCallback(() => {
    setPublicKey(null)
    setNetwork(NETWORKS.testnet)
  }, [])

  return (
    <WalletContext.Provider value={{ publicKey, network, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
