import { NextRequest, NextResponse } from 'next/server'

/**
 * Returns a 401 response if API_SECRET_KEY is set and the request does not
 * supply a matching `Authorization: Bearer <key>` header. Returns null when
 * the request is authorized (or when no key is configured, i.e. dev mode).
 */
export function requireApiKey(req: NextRequest): NextResponse | null {
  const secret = process.env.API_SECRET_KEY
  if (!secret) return null // no key configured → allow all (local dev)

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/**
 * Returns a 401 response if CRON_SECRET (or API_SECRET_KEY) is configured and
 * the request does not supply a matching `Authorization: Bearer <secret>` or `X-Cron-Secret` header.
 * Returns null when authorized.
 */
export function requireCronSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET || process.env.API_SECRET_KEY
  if (!secret) return null // no secret configured → allow all (local dev)

  const authHeader = req.headers.get('authorization')
  const cronHeader = req.headers.get('x-cron-secret')

  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (bearerToken === secret || cronHeader === secret) {
    return null
  }

  return NextResponse.json({ error: 'Unauthorized scheduled scan trigger' }, { status: 401 })
}

