import type { ScanRequest, ScanResponse } from '@/types/findings'
import type { StellarNetwork } from '@/types/stellar'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '')

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

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message)
    this.name = 'TimeoutError'
  }
}

export async function scanContract(source: string, network?: StellarNetwork): Promise<ScanResponse> {
  const body: ScanRequest = { source }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (network) headers['X-Network'] = network.name

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      if (res.status === 429) {
        const retryAfterHeader = res.headers.get('Retry-After')
        const retryAfter = retryAfterHeader ? Math.ceil(parseFloat(retryAfterHeader)) : 60
        throw new ApiError(429, 'Rate limited', retryAfter)
      }
      const text = await res.text().catch(() => 'Unknown error')
      throw new ApiError(res.status, text || `HTTP ${res.status}`)
    }

    return res.json() as Promise<ScanResponse>
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new TimeoutError('Scan timed out after 30s')
    }
    throw err
  }
}
