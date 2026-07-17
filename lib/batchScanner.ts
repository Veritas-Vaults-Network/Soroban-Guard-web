import { scanContract, ScanResult, ScanQuota, ApiError } from './api'
import type { StellarNetwork } from '@/types/stellar'

export interface BatchScanConfig {
  /** Maximum concurrent requests (default: 3) */
  maxConcurrency?: number
  /** Minimum concurrency even under quota pressure (default: 1) */
  minConcurrency?: number
  /** Max retries per item for transient failures (default: 2) */
  maxRetries?: number
  /** Base delay in ms for retry backoff (default: 1000) */
  retryBaseDelay?: number
  /** Quota threshold below which to reduce concurrency (default: 0.2 = 20%) */
  quotaThreshold?: number
}

export interface BatchScanItem {
  contractId: string
  result?: ScanResult
  error?: string
  attempts: number
}

export interface BatchScanProgress {
  completed: number
  total: number
  currentConcurrency: number
  items: BatchScanItem[]
}

type ProgressCallback = (progress: BatchScanProgress) => void
type CancelCheck = () => boolean

const DEFAULT_CONFIG: Required<BatchScanConfig> = {
  maxConcurrency: 3,
  minConcurrency: 1,
  maxRetries: 2,
  retryBaseDelay: 1000,
  quotaThreshold: 0.2,
}

/**
 * Determines if an error is transient and should be retried.
 */
function isTransientError(error: unknown): boolean {
  if (error instanceof ApiError) {
    // Retry on rate limit (429) or server errors (5xx)
    return error.status === 429 || (error.status >= 500 && error.status < 600)
  }
  // Network errors are transient
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  return false
}

/**
 * Calculate delay for retry based on attempt number and potential rate limit info.
 */
function getRetryDelay(attempt: number, baseDelay: number, error?: unknown): number {
  if (error instanceof ApiError && error.retryAfter) {
    return error.retryAfter * 1000
  }
  // Exponential backoff with jitter
  const exponentialDelay = Math.pow(2, attempt) * baseDelay
  const jitter = Math.random() * 0.3 * exponentialDelay
  return Math.min(exponentialDelay + jitter, 30000) // Cap at 30s
}

/**
 * Calculate dynamic concurrency based on quota.
 */
function calculateConcurrency(
  quota: ScanQuota | undefined,
  config: Required<BatchScanConfig>
): number {
  if (!quota) {
    return config.maxConcurrency
  }

  const quotaRatio = quota.remaining / quota.limit

  if (quotaRatio <= 0) {
    // No quota left, wait for reset
    return 0
  }

  if (quotaRatio <= config.quotaThreshold) {
    // Low quota, reduce to minimum
    return config.minConcurrency
  }

  if (quotaRatio <= config.quotaThreshold * 2) {
    // Getting low, reduce concurrency proportionally
    const reduction = Math.ceil(
      config.maxConcurrency * (1 - quotaRatio / (config.quotaThreshold * 2))
    )
    return Math.max(config.minConcurrency, config.maxConcurrency - reduction)
  }

  return config.maxConcurrency
}

/**
 * Batch scanner with configurable concurrency, quota-aware throttling, and retry logic.
 */
export async function batchScan(
  contractIds: string[],
  network: StellarNetwork,
  onProgress: ProgressCallback,
  shouldCancel: CancelCheck,
  config: BatchScanConfig = {}
): Promise<BatchScanItem[]> {
  const cfg: Required<BatchScanConfig> = { ...DEFAULT_CONFIG, ...config }

  if (contractIds.length === 0) {
    return []
  }

  const items: BatchScanItem[] = contractIds.map((contractId) => ({
    contractId,
    attempts: 0,
  }))

  const queue: BatchScanItem[] = [...items]
  let currentConcurrency = cfg.maxConcurrency
  let latestQuota: ScanQuota | undefined
  let activeCount = 0

  const reportProgress = () => {
    const completed = items.filter((item) => item.result || item.error).length
    onProgress({
      completed,
      total: items.length,
      currentConcurrency,
      items: [...items],
    })
  }

  const processItem = async (item: BatchScanItem): Promise<boolean> => {
    item.attempts++

    try {
      const result = await scanContract(item.contractId, network)
      item.result = result

      // Update quota info for dynamic concurrency
      if (result.quota) {
        latestQuota = result.quota
        const newConcurrency = calculateConcurrency(latestQuota, cfg)
        if (newConcurrency !== currentConcurrency) {
          currentConcurrency = newConcurrency
        }
      }
      return true // Item completed successfully
    } catch (error) {
      const canRetry = item.attempts <= cfg.maxRetries && isTransientError(error)

      if (canRetry && !shouldCancel()) {
        // Wait before retry
        const delay = getRetryDelay(item.attempts, cfg.retryBaseDelay, error)
        await new Promise((resolve) => setTimeout(resolve, delay))

        if (!shouldCancel()) {
          return false // Item needs to be retried
        }
        item.error = 'Cancelled'
      } else {
        // Permanent failure
        item.error = error instanceof Error ? error.message : 'Scan failed'
      }
      return true // Item completed (with error)
    }
  }

  // Process queue with concurrency control
  const processQueue = async (): Promise<void> => {
    while (queue.length > 0 || activeCount > 0) {
      if (shouldCancel()) {
        // Mark remaining items as cancelled
        for (const item of queue) {
          if (!item.result && !item.error) {
            item.error = 'Cancelled'
          }
        }
        queue.length = 0
        break
      }

      // Check if we should pause due to quota exhaustion
      if (currentConcurrency === 0 && latestQuota) {
        const waitTime = latestQuota.resetAt - Date.now()
        if (waitTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, Math.min(waitTime, 5000)))
          currentConcurrency = calculateConcurrency(latestQuota, cfg)
        }
        continue
      }

      // Wait if at capacity or queue is empty but work is in progress
      if (activeCount >= currentConcurrency || (queue.length === 0 && activeCount > 0)) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        continue
      }

      const item = queue.shift()
      if (!item) continue

      activeCount++
      // Process asynchronously
      ;(async () => {
        try {
          const completed = await processItem(item)
          if (!completed && !shouldCancel()) {
            // Re-queue for retry
            queue.push(item)
          }
          reportProgress()
        } finally {
          activeCount--
        }
      })()
    }

    // Wait for any remaining active work
    while (activeCount > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  await processQueue()
  reportProgress()
  return items
}
