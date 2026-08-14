import { SorobanGuardClient, ApiError, TimeoutError } from 'soroban-guard-sdk'
import type { ScanQuota, ScanResult } from 'soroban-guard-sdk'
import type { StellarNetwork } from '@/types/stellar'
import type { NetworkScanResult, MultiNetworkResults } from '@/types/findings'

export { ApiError, TimeoutError }
export type { ScanQuota, ScanResult }

const client = new SorobanGuardClient()

/**
 * Submit source code to the Soroban Guard API for scanning.
 * @param source - Contract source code or identifier
 * @param network - Optional Stellar network to target
 * @returns Scan result including findings and optional quota info
 * @throws {ApiError} On HTTP errors or rate limiting
 */
export async function scanContract(source: string, network?: StellarNetwork): Promise<ScanResult> {
  return client.scan(source, network as any)
}

/**
 * Scan a contract ID across multiple Stellar networks in parallel.
 * Partial availability is handled gracefully: a contract missing from one
 * network does not cause an overall failure.
 * @param source - Contract ID to scan
 * @param networks - Array of Stellar networks to scan against
 * @returns Array of per-network scan results with status indicators
 */
export async function scanContractMultiNetwork(
  source: string,
  networks: StellarNetwork[],
): Promise<MultiNetworkResults> {
  const results = await Promise.allSettled(
    networks.map(async (network) => {
      try {
        const data = await client.scan(source, network as any)
        return {
          network: network.name,
          findings: data.findings,
          status: 'success' as const,
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return {
            network: network.name,
            findings: [],
            status: 'not_found' as const,
            error: `Contract not found on ${network.name}`,
          }
        }
        throw err
      }
    }),
  )

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    return {
      network: networks[i].name,
      findings: [],
      status: 'error' as const,
      error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
    }
  })
}

