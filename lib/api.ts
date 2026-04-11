import type { ScanRequest, ScanResponse } from '@/types/findings'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function scanContract(source: string): Promise<ScanResponse> {
  const body: ScanRequest = { source }

  const res = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new ApiError(res.status, text || `HTTP ${res.status}`)
  }

  return res.json() as Promise<ScanResponse>
}
