import { NextRequest, NextResponse } from 'next/server'
import type { Finding } from '@/types/findings'
import { requireApiKey } from '@/lib/apiAuth'

const TTL_MS = 60 * 60 * 1000 // 1 hour
const TTL_S = 60 * 60

interface CacheEntry {
  findings: Finding[]
  expiresAt: number
}

// In-memory fallback (used when KV_REST_API_URL is not configured)
const memCache = new Map<string, CacheEntry>()

async function cacheGet(token: string): Promise<CacheEntry | null> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    return kv.get<CacheEntry>(`webhook:${token}`)
  }
  const entry = memCache.get(token)
  return entry && entry.expiresAt > Date.now() ? entry : null
}

async function cacheSet(token: string, value: CacheEntry): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    await kv.set(`webhook:${token}`, value, { ex: TTL_S })
  } else {
    // Evict expired entries before writing
    const now = Date.now()
    for (const [k, v] of memCache) {
      if (v.expiresAt <= now) memCache.delete(k)
    }
    memCache.set(token, value)
  }
}

export async function GET(req: NextRequest) {
  const authError = requireApiKey(req)
  if (authError) return authError

  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const entry = await cacheGet(token)
  if (!entry || entry.expiresAt <= Date.now()) {
    return NextResponse.json({ error: 'Not found or expired' }, { status: 404 })
  }
  return NextResponse.json({ findings: entry.findings })
}

export async function POST(req: NextRequest) {
  const authError = requireApiKey(req)
  if (authError) return authError

  let body: { findings?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.findings)) {
    return NextResponse.json({ error: 'findings must be an array' }, { status: 400 })
  }

  const token = crypto.randomUUID()
  await cacheSet(token, { findings: body.findings as Finding[], expiresAt: Date.now() + TTL_MS })

  return NextResponse.json({ token }, { status: 201 })
}
