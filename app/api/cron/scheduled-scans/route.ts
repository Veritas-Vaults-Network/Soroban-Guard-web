import { NextResponse } from 'next/server'

/**
 * GET /api/cron/scheduled-scans
 *
 * Called by Vercel Cron (or any external scheduler). Reads due scans from the
 * request body (passed by the client-side trigger) and executes them.
 *
 * Because scheduled scans are stored in localStorage (client-side), this route
 * acts as the scan executor. The client calls it with the list of due scans
 * obtained from getDueScans(), and this route fans out the scan requests to the
 * upstream API and returns aggregated results.
 *
 * Authorization: protected by CRON_SECRET env var when set.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '')

interface DueScan {
  contractId: string
  network: string
}

export async function POST(request: Request) {
  // Optional secret check (set CRON_SECRET in env for production)
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: { scans: DueScan[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { scans } = body
  if (!Array.isArray(scans) || scans.length === 0) {
    return NextResponse.json({ triggered: 0 })
  }

  const results = await Promise.allSettled(
    scans.map(async ({ contractId, network }) => {
      const res = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(network ? { 'X-Network': network } : {}),
        },
        body: JSON.stringify({ source: contractId }),
        signal: AbortSignal.timeout(30_000),
      })
      if (!res.ok) throw new Error(`Scan failed for ${contractId}: HTTP ${res.status}`)
      const data = await res.json()
      return { contractId, network, findings: data.findings ?? [] }
    }),
  )

  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ triggered: scans.length, succeeded, failed })
}
