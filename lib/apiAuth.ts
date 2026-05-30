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
