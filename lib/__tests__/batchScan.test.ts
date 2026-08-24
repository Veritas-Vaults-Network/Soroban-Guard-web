import { describe, it, expect, vi } from 'vitest'
import { scanContractBatch, ApiError, TimeoutError } from '../api'
import type { ScanResult } from 'soroban-guard-sdk'

describe('scanContractBatch', () => {
  it('processes all items successfully and aggregates findings', async () => {
    const mockScan = vi.fn().mockImplementation(async (source: string) => {
      return {
        findings: [{ severity: 'High', check_name: 'test-check', description: `Finding for ${source}` }],
      } as ScanResult
    })

    const sources = ['CONTRACT_1', 'CONTRACT_2', 'CONTRACT_3']
    const statusChanges: string[] = []

    const result = await scanContractBatch(sources, {
      concurrencyLimit: 2,
      scanFn: mockScan,
      onItemStatusChange: (item) => {
        statusChanges.push(`${item.source}:${item.status}`)
      },
    })

    expect(result.items).toHaveLength(3)
    expect(result.successCount).toBe(3)
    expect(result.failureCount).toBe(0)
    expect(result.totalFindings).toBe(3)

    expect(statusChanges).toContain('CONTRACT_1:running')
    expect(statusChanges).toContain('CONTRACT_1:done')
    expect(statusChanges).toContain('CONTRACT_2:running')
    expect(statusChanges).toContain('CONTRACT_2:done')
    expect(statusChanges).toContain('CONTRACT_3:running')
    expect(statusChanges).toContain('CONTRACT_3:done')
  })

  it('enforces concurrency limit', async () => {
    let currentInFlight = 0
    let maxInFlight = 0

    const mockScan = vi.fn().mockImplementation(async () => {
      currentInFlight++
      if (currentInFlight > maxInFlight) {
        maxInFlight = currentInFlight
      }
      await new Promise((resolve) => setTimeout(resolve, 30))
      currentInFlight--
      return { findings: [] } as ScanResult
    })

    const sources = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']
    await scanContractBatch(sources, {
      concurrencyLimit: 2,
      scanFn: mockScan,
    })

    expect(maxInFlight).toBeLessThanOrEqual(2)
  })

  it('handles partial failure where one item fails and others succeed', async () => {
    const mockScan = vi.fn().mockImplementation(async (source: string) => {
      if (source === 'FAIL_CONTRACT') {
        throw new Error('Compilation syntax error')
      }
      return {
        findings: [{ severity: 'Low', check_name: 'unused-var' }],
      } as ScanResult
    })

    const sources = ['CONTRACT_A', 'FAIL_CONTRACT', 'CONTRACT_B']

    const result = await scanContractBatch(sources, {
      concurrencyLimit: 2,
      scanFn: mockScan,
    })

    expect(result.items).toHaveLength(3)
    expect(result.successCount).toBe(2)
    expect(result.failureCount).toBe(1)
    expect(result.totalFindings).toBe(2)

    const failedItem = result.items.find((i) => i.source === 'FAIL_CONTRACT')
    expect(failedItem?.status).toBe('failed')
    expect(failedItem?.error).toBe('Compilation syntax error')

    const successItem = result.items.find((i) => i.source === 'CONTRACT_A')
    expect(successItem?.status).toBe('done')
    expect(successItem?.findings).toHaveLength(1)
  })

  it('handles rate-limit 429 ApiError carrying retryAfter metadata', async () => {
    const mockScan = vi.fn().mockImplementation(async (source: string) => {
      if (source === 'LIMITED_CONTRACT') {
        throw new ApiError(429, 'Rate limited', 45)
      }
      return { findings: [] } as ScanResult
    })

    const sources = ['OK_CONTRACT', 'LIMITED_CONTRACT']

    const result = await scanContractBatch(sources, {
      scanFn: mockScan,
    })

    expect(result.failureCount).toBe(1)
    expect(result.successCount).toBe(1)

    const limitedItem = result.items.find((i) => i.source === 'LIMITED_CONTRACT')
    expect(limitedItem?.status).toBe('failed')
    expect(limitedItem?.error).toBe('Rate limited')
    expect(limitedItem?.retryAfter).toBe(45)
  })

  it('handles TimeoutError gracefully', async () => {
    const mockScan = vi.fn().mockImplementation(async () => {
      throw new TimeoutError()
    })

    const result = await scanContractBatch(['TIMED_OUT'], { scanFn: mockScan })

    expect(result.failureCount).toBe(1)
    expect(result.items[0].status).toBe('failed')
    expect(result.items[0].error).toContain('timed out')
  })
})
