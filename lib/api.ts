import { SorobanGuardClient, ApiError, TimeoutError } from 'soroban-guard-sdk'
import type { ScanQuota, ScanResult } from 'soroban-guard-sdk'
import type { StellarNetwork } from '@/types/stellar'

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

