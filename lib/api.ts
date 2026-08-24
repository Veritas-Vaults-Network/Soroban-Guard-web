import { SorobanGuardClient, ApiError, TimeoutError } from 'soroban-guard-sdk'
import type { ScanQuota, ScanResult } from 'soroban-guard-sdk'
import type { StellarNetwork } from '@/types/stellar'
import type { MultiNetworkResults, Finding } from '@/types/findings'

export { ApiError, TimeoutError }
export type { ScanQuota, ScanResult }

const client = new SorobanGuardClient()

export type BatchItemStatus = 'pending' | 'running' | 'done' | 'failed'

export interface BatchScanItem {
  id: string
  source: string
  mode?: 'code' | 'github' | 'contractId'
  network?: StellarNetwork
  status: BatchItemStatus
  findings?: Finding[]
  error?: string
  retryAfter?: number
}

export interface BatchScanOptions {
  /** Cap on concurrent in-flight scans. Default is 3. */
  concurrencyLimit?: number
  /** Callback fired whenever an item's status or results change */
  onItemStatusChange?: (item: BatchScanItem) => void
  /** Global network override */
  network?: StellarNetwork
  /** Optional custom scan function (for testing/injection) */
  scanFn?: (source: string, network?: StellarNetwork) => Promise<ScanResult>
}

export interface BatchScanResult {
  items: BatchScanItem[]
  totalFindings: number
  successCount: number
  failureCount: number
}

/**
 * Get the API base URL from the client (browser) environment.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:3001'
  }
  return (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '')
}

/**
 * Check whether the Soroban Guard API backend is reachable.
 * @returns True if /health responds with 200 within 5 seconds
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}

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

/**
 * Submit a batch of contract sources for scanning with bounded concurrency and per-item status tracking.
 * One failing contract will NOT sink the overall batch; partial results are preserved.
 *
 * @param sources Array of contract sources or IDs
 * @param options Options including concurrencyLimit (default: 3) and onItemStatusChange callback
 */
export async function scanContractBatch(
  sources: string[],
  options?: BatchScanOptions,
): Promise<BatchScanResult> {
  const limit = Math.max(1, options?.concurrencyLimit ?? 3)
  const scanFn = options?.scanFn ?? scanContract

  const items: BatchScanItem[] = sources.map((source, idx) => ({
    id: `batch-item-${idx}-${Math.random().toString(36).slice(2, 7)}`,
    source,
    status: 'pending',
    network: options?.network,
  }))

  const queue = [...items]

  const processItem = async (item: BatchScanItem) => {
    item.status = 'running'
    options?.onItemStatusChange?.({ ...item })

    try {
      const result = await scanFn(item.source, item.network)
      item.findings = result.findings
      item.status = 'done'
    } catch (err) {
      item.status = 'failed'
      if (err instanceof ApiError) {
        item.error = err.message || `HTTP ${err.status}`
        if (err.status === 429 && err.retryAfter !== undefined) {
          item.retryAfter = err.retryAfter
        }
      } else if (err instanceof TimeoutError) {
        item.error = err.message
      } else if (err instanceof Error) {
        item.error = err.message
      } else {
        item.error = 'Scan failed'
      }
    } finally {
      options?.onItemStatusChange?.({ ...item })
    }
  }

  const workerCount = Math.min(limit, items.length)
  const workers = Array.from({ length: workerCount }, async () => {
    while (queue.length > 0) {
      const nextItem = queue.shift()
      if (nextItem) {
        await processItem(nextItem)
      }
    }
  })

  await Promise.all(workers)

  const successCount = items.filter((i) => i.status === 'done').length
  const failureCount = items.filter((i) => i.status === 'failed').length
  const totalFindings = items.reduce((sum, i) => sum + (i.findings?.length ?? 0), 0)

  return {
    items,
    totalFindings,
    successCount,
    failureCount,
  }
}


