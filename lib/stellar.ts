/**
 * Stellar / Soroban blockchain integration helpers.
 *
 * Uses the Horizon REST API and Soroban RPC to:
 *  - Resolve a contract ID to its WASM source via Horizon
 *  - Fetch contract WASM bytecode from Soroban RPC
 *  - Validate Stellar public keys (G-addresses)
 *  - Validate Soroban contract IDs (C-addresses)
 */

import type { ContractInfo, StellarNetwork } from '@/types/stellar'

// ── Key / address validation ──────────────────────────────────────────────────

const G_ADDRESS_RE = /^G[A-Z2-7]{55}$/
const C_ADDRESS_RE = /^C[A-Z2-7]{55}$/

export function isValidPublicKey(key: string): boolean {
  return G_ADDRESS_RE.test(key)
}

export function isValidContractId(id: string): boolean {
  return C_ADDRESS_RE.test(id)
}

// Matches stellar.expert and stellarexpert.io contract explorer URLs
const EXPLORER_CONTRACT_RE = /^https?:\/\/(?:stellar\.expert|stellarexpert\.io)\/explorer\/[^/]+\/contract\/([A-Z2-7]{56})(?:[/?#].*)?$/i

export function extractContractIdFromUrl(url: string): string | null {
  const match = url.trim().match(EXPLORER_CONTRACT_RE)
  if (!match) return null
  const id = match[1].toUpperCase()
  return isValidContractId(id) ? id : null
}

// ── Horizon helpers ───────────────────────────────────────────────────────────

/**
 * Fetch basic contract metadata from Horizon.
 * Returns null if the contract does not exist on the given network.
 */
export async function fetchContractInfo(
  contractId: string,
  network: StellarNetwork,
): Promise<ContractInfo | null> {
  if (!isValidContractId(contractId)) return null

  const url = `${network.horizonUrl}/contracts/${contractId}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Horizon error ${res.status}: ${await res.text()}`)

  const data = (await res.json()) as any
  return {
    contractId,
    wasmHash: data.wasm_id ?? data.wasm_hash ?? '',
    network: network.name,
    createdAt: data.paging_token ?? undefined,
  }
}

// ── Soroban RPC helpers ───────────────────────────────────────────────────────

interface RpcRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params: unknown
}

async function rpcCall<T>(
  rpcUrl: string,
  method: string,
  params: unknown,
): Promise<T> {
  const body: RpcRequest = { jsonrpc: '2.0', id: 1, method, params }
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`RPC HTTP error ${res.status}`)
  const json = (await res.json()) as any
  if (json.error) throw new Error(`RPC error: ${json.error.message}`)
  return json.result as T
}

/**
 * Fetch the WASM bytecode for a contract from Soroban RPC.
 * Returns the hex-encoded WASM string, or null if not found.
 */
export async function fetchContractWasm(
  contractId: string,
  network: StellarNetwork,
): Promise<string | null> {
  if (!isValidContractId(contractId)) return null

  try {
    const result = await rpcCall<{ wasm: string }>(
      network.sorobanRpcUrl,
      'getContractWasm',
      { contract_id: contractId },
    )
    return result.wasm ?? null
  } catch {
    return null
  }
}

/**
 * Fetch the ledger entry for a contract's code (WASM hash).
 * Uses getLedgerEntries RPC method.
 */
export async function fetchContractCode(
  wasmHash: string,
  network: StellarNetwork,
): Promise<string | null> {
  if (!wasmHash) return null

  try {
    // XDR key for ContractCode ledger entry — base64 encoded
    // In practice the caller would build the XDR key; here we use the hash directly
    const result = await rpcCall<{ entries: Array<{ xdr: string }> }>(
      network.sorobanRpcUrl,
      'getLedgerEntries',
      { keys: [wasmHash] },
    )
    return result.entries?.[0]?.xdr ?? null
  } catch {
    return null
  }
}

// ── Network health ────────────────────────────────────────────────────────────

export async function checkNetworkHealth(network: StellarNetwork): Promise<boolean> {
  try {
    const res = await fetch(`${network.horizonUrl}/`, {
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}
