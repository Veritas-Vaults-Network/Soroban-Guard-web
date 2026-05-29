/**
 * Freighter wallet integration.
 *
 * Freighter is the official Stellar browser extension wallet.
 * Docs: https://docs.freighter.app/
 *
 * This module wraps the window.freighter API with typed helpers and
 * graceful fallbacks when the extension is not installed.
 */

import type { StellarNetwork } from '@/types/stellar'
import { NETWORKS } from '@/types/stellar'

// Freighter injects window.freighter — we type just what we need
interface FreighterAPI {
  isConnected(): Promise<boolean>
  getPublicKey(): Promise<string>
  getNetwork(): Promise<string>
  getNetworkDetails(): Promise<{ networkPassphrase: string; networkUrl: string }>
  signTransaction(xdr: string, opts?: { network?: string; networkPassphrase?: string }): Promise<string>
}

function getFreighter(): FreighterAPI | null {
  if (typeof window === 'undefined') return null
  return (window as Window & { freighter?: FreighterAPI }).freighter ?? null
}

/**
 * Check whether the Freighter browser extension is installed.
 * @returns True if the Freighter API is available on window
 */
export function isFreighterInstalled(): boolean {
  return getFreighter() !== null
}

/**
 * Connect to Freighter and return the user's public key.
 * @returns The connected public key, or null if unavailable/rejected
 */
export async function connectFreighter(): Promise<string | null> {
  const freighter = getFreighter()
  if (!freighter) return null

  try {
    const connected = await freighter.isConnected()
    if (!connected) return null
    return await freighter.getPublicKey()
  } catch {
    return null
  }
}

/**
 * Get the currently selected Stellar network from Freighter.
 * @returns The matching StellarNetwork, or null if unavailable
 */
export async function getFreighterNetwork(): Promise<StellarNetwork | null> {
  const freighter = getFreighter()
  if (!freighter) return null

  try {
    const details = await freighter.getNetworkDetails()
    const passphrase = details.networkPassphrase

    const match = Object.values(NETWORKS).find(
      n => n.networkPassphrase === passphrase,
    )
    return match ?? NETWORKS.testnet
  } catch {
    return null
  }
}

/**
 * Sign a Stellar transaction XDR using Freighter.
 * @param xdr - Base64-encoded transaction XDR
 * @param network - The Stellar network to sign for
 * @returns Signed XDR string, or null if rejected/unavailable
 */
export async function signTransaction(
  xdr: string,
  network: StellarNetwork,
): Promise<string | null> {
  const freighter = getFreighter()
  if (!freighter) return null

  try {
    return await freighter.signTransaction(xdr, {
      networkPassphrase: network.networkPassphrase,
    })
  } catch {
    return null
  }
}
