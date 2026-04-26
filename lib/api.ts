import type { ScanRequest, ScanResponse } from '@/types/findings'
import type { StellarNetwork } from '@/types/stellar'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '')

export interface ScanQuota {
  remaining: number
  limit: number
  resetAt: number // unix ms
}

export class ApiError extends Error {
  public retryAfter?: number

  constructor(
    public status: number,
    message: string,
    retryAfter?: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.retryAfter = retryAfter
  }
}

export interface ScanResult extends ScanResponse {
  quota?: ScanQuota
}

export async function scanContract(source: string, network?: StellarNetwork): Promise<ScanResult> {
  const body: ScanRequest = { source }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (network) headers['X-Network'] = network.name

  const res = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    if (res.status === 429) {
      const retryAfterHeader = res.headers.get('Retry-After')
      const retryAfter = retryAfterHeader ? Math.ceil(parseFloat(retryAfterHeader)) : 60
      throw new ApiError(429, 'Rate limited', retryAfter)
    }
    const text = await res.text().catch(() => 'Unknown error')
    throw new ApiError(res.status, text || `HTTP ${res.status}`)
  }

  const data = (await res.json()) as ScanResponse

  const remaining = res.headers.get('X-RateLimit-Remaining')
  const limit = res.headers.get('X-RateLimit-Limit')
  const reset = res.headers.get('X-RateLimit-Reset')

  const quota: ScanQuota | undefined =
    remaining !== null && limit !== null && reset !== null
      ? {
          remaining: parseInt(remaining, 10),
          limit: parseInt(limit, 10),
          resetAt: parseInt(reset, 10) * 1000, // convert epoch seconds → ms
        }
      : undefined

  return { ...data, quota }
}
