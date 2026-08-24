import { NextRequest, NextResponse } from 'next/server'
import { requireCronSecret } from '@/lib/apiAuth'

/**
 * Scheduled scan cron route handler.
 * Triggered by external cron runners (e.g. Vercel Cron or GitHub Actions).
 * Must be authenticated with a matching secret header.
 */
export async function POST(req: NextRequest) {
  const authError = requireCronSecret(req)
  if (authError) return authError

  try {
    const body = await req.json().catch(() => ({}))
    const { contracts } = body as { contracts?: string[] }

    return NextResponse.json({
      status: 'ok',
      message: 'Scheduled scan job authorized',
      scannedCount: Array.isArray(contracts) ? contracts.length : 0,
      timestamp: Date.now(),
    })
  } catch {
    return NextResponse.json({ error: 'Invalid scheduled scan request' }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req)
  if (authError) return authError

  return NextResponse.json({
    status: 'ok',
    message: 'Scheduled scan service active',
    timestamp: Date.now(),
  })
}
