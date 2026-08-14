import { batchScan, BatchScanConfig, BatchScanItem, BatchScanProgress } from '../batchScanner'
import { scanContract, ApiError } from '../api'

// Mock the api module
jest.mock('../api', () => ({
  scanContract: jest.fn(),
  ApiError: class ApiError extends Error {
    public retryAfter?: number
    constructor(public status: number, message: string, retryAfter?: number) {
      super(message)
      this.name = 'ApiError'
      this.retryAfter = retryAfter
    }
  },
}))

const mockScanContract = scanContract as jest.MockedFunction<typeof scanContract>

const mockNetwork = { name: 'testnet', url: 'https://testnet.stellar.org' } as any

describe('batchScanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('scans multiple contracts concurrently', async () => {
    const contractIds = ['contract1', 'contract2', 'contract3']
    let concurrencyObserved = 0

    mockScanContract.mockImplementation(async () => {
      concurrencyObserved++
      await new Promise((resolve) => setTimeout(resolve, 50))
      return { findings: [], quota: { remaining: 100, limit: 100, resetAt: Date.now() + 60000 } }
    })

    const progressUpdates: BatchScanProgress[] = []
    const result = await batchScan(
      contractIds,
      mockNetwork,
      (progress) => progressUpdates.push({ ...progress }),
      () => false,
      { maxConcurrency: 3 }
    )

    expect(result).toHaveLength(3)
    expect(result.every((item) => item.result)).toBe(true)
    expect(mockScanContract).toHaveBeenCalledTimes(3)
  })

  it('respects maxConcurrency limit', async () => {
    const contractIds = ['c1', 'c2', 'c3', 'c4', 'c5']
    let maxConcurrent = 0
    let currentConcurrent = 0

    mockScanContract.mockImplementation(async () => {
      currentConcurrent++
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
      await new Promise((resolve) => setTimeout(resolve, 20))
      currentConcurrent--
      return { findings: [], quota: { remaining: 100, limit: 100, resetAt: Date.now() + 60000 } }
    })

    await batchScan(contractIds, mockNetwork, () => {}, () => false, { maxConcurrency: 2 })

    expect(maxConcurrent).toBeLessThanOrEqual(2)
    expect(mockScanContract).toHaveBeenCalledTimes(5)
  })

  it('cancels in-progress and pending work correctly', async () => {
    const contractIds = ['c1', 'c2', 'c3', 'c4', 'c5']
    let cancelled = false
    let callCount = 0

    mockScanContract.mockImplementation(async () => {
      callCount++
      await new Promise((resolve) => setTimeout(resolve, 50))
      return { findings: [] }
    })

    // Cancel after a short delay
    setTimeout(() => {
      cancelled = true
    }, 30)

    const result = await batchScan(
      contractIds,
      mockNetwork,
      () => {},
      () => cancelled,
      { maxConcurrency: 2 }
    )

    // Some items should be cancelled
    const cancelledItems = result.filter((item) => item.error === 'Cancelled')
    expect(cancelledItems.length).toBeGreaterThan(0)
  })

  it('retries transient failures', async () => {
    const contractIds = ['contract1']
    let attemptCount = 0

    mockScanContract.mockImplementation(async () => {
      attemptCount++
      if (attemptCount < 2) {
        throw new ApiError(500, 'Server error')
      }
      return { findings: [] }
    })

    const result = await batchScan(
      contractIds,
      mockNetwork,
      () => {},
      () => false,
      { maxRetries: 2, retryBaseDelay: 10 }
    )

    expect(result[0].result).toBeDefined()
    expect(attemptCount).toBe(2)
  })

  it('does not retry permanent failures', async () => {
    const contractIds = ['contract1']
    let attemptCount = 0

    mockScanContract.mockImplementation(async () => {
      attemptCount++
      throw new ApiError(400, 'Bad request')
    })

    const result = await batchScan(
      contractIds,
      mockNetwork,
      () => {},
      () => false,
      { maxRetries: 3 }
    )

    expect(result[0].error).toBe('Bad request')
    expect(attemptCount).toBe(1)
  })

  it('reduces concurrency when quota is low', async () => {
    const contractIds = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']
    let callOrder = 0
    const concurrencyLevels: number[] = []

    mockScanContract.mockImplementation(async () => {
      callOrder++
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Simulate decreasing quota (but never to zero to avoid waiting for reset)
      const remaining = Math.max(10, 40 - callOrder * 5) // Goes from 35 down to 10
      return {
        findings: [],
        quota: { remaining, limit: 100, resetAt: Date.now() + 60000 },
      }
    })

    await batchScan(
      contractIds,
      mockNetwork,
      (progress) => concurrencyLevels.push(progress.currentConcurrency),
      () => false,
      { maxConcurrency: 3, quotaThreshold: 0.2, minConcurrency: 1 }
    )

    // Concurrency should have decreased as quota got low (below 40% threshold)
    // Initial concurrency is 3, should reduce to 1 or 2 when quota drops
    const lastFewLevels = concurrencyLevels.slice(-4)
    expect(lastFewLevels.some((level) => level < 3)).toBe(true)
  })

  it('respects rate limit retry-after header', async () => {
    const contractIds = ['contract1']
    let attemptCount = 0

    mockScanContract.mockImplementation(async () => {
      attemptCount++
      if (attemptCount === 1) {
        throw new ApiError(429, 'Rate limited', 0.01) // 10ms retry-after
      }
      return { findings: [] }
    })

    const startTime = Date.now()
    const result = await batchScan(
      contractIds,
      mockNetwork,
      () => {},
      () => false,
      { maxRetries: 2, retryBaseDelay: 100 }
    )

    expect(result[0].result).toBeDefined()
    expect(attemptCount).toBe(2)
    // Should have waited approximately 10ms (the retry-after value)
    expect(Date.now() - startTime).toBeGreaterThanOrEqual(5)
  })

  it('reports progress correctly', async () => {
    const contractIds = ['c1', 'c2', 'c3']
    const progressUpdates: BatchScanProgress[] = []

    mockScanContract.mockImplementation(async (id) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return { findings: [{ id: '1', severity: 'Low', title: 'Test', description: 'Test' }] } as any
    })

    await batchScan(
      contractIds,
      mockNetwork,
      (progress) => progressUpdates.push({ ...progress, items: [...progress.items] }),
      () => false,
      { maxConcurrency: 1 }
    )

    // Check that progress went from 0 to 3
    expect(progressUpdates.length).toBeGreaterThanOrEqual(3)
    expect(progressUpdates[progressUpdates.length - 1].completed).toBe(3)
    expect(progressUpdates[progressUpdates.length - 1].total).toBe(3)
  })

  it('handles empty contract list', async () => {
    const result = await batchScan([], mockNetwork, () => {}, () => false)
    expect(result).toEqual([])
    expect(mockScanContract).not.toHaveBeenCalled()
  })

  it('preserves contract order in results', async () => {
    const contractIds = ['a', 'b', 'c', 'd', 'e']

    mockScanContract.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 20))
      return { findings: [] }
    })

    const result = await batchScan(contractIds, mockNetwork, () => {}, () => false, {
      maxConcurrency: 3,
    })

    expect(result.map((r) => r.contractId)).toEqual(contractIds)
  })
})
