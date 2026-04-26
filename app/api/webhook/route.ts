import { NextRequest, NextResponse } from 'next/server'
import type { Finding } from '@/types/findings'

const TTL_MS = 60 * 60 * 1000 // 1 hour

interface CacheEntry {
  findings: Finding[]
  expiresAt: number
}

// Module-level map persists across requests in the same server process
const cache = new Map<string, CacheEntry>()

function evict() {
  const now = Date.now()
  for (const [k, v] of cache) {
    if (v.expiresAt <= now) cache.delete(k)
  }
}

export function GET(req: NextRequest, { params }: { params: { token: string } }) {
  evict()
  const entry = cache.get(params.token)
  if (!entry || entry.expiresAt <= Date.now()) {
    return NextResponse.json({ error: 'Not found or expired' }, { status: 404 })
  }
  return NextResponse.json({ findings: entry.findings })
}

export async function POST(req: NextRequest) {
  let body: { findings?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.findings)) {
    return NextResponse.json({ error: 'findings must be an array' }, { status: 400 })
  }

  evict()

  const token = crypto.randomUUID()
  cache.set(token, { findings: body.findings as Finding[], expiresAt: Date.now() + TTL_MS })

  return NextResponse.json({ token }, { status: 201 })
}
