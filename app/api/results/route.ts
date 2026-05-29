import { NextRequest, NextResponse } from 'next/server'
import type { Finding } from '@/types/findings'

interface StoredResult {
  findings: Finding[]
  createdAt: number
}

// In-memory store (compatible with Vercel KV when available)
const store = new Map<string, StoredResult>()

const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function generateId(): string {
  return Math.random().toString(36).slice(2, 8)
}

function purgeExpired() {
  const now = Date.now()
  const keys = Array.from(store.keys())
  for (const id of keys) {
    const entry = store.get(id)
    if (entry && now - entry.createdAt > TTL_MS) store.delete(id)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { findings } = (await req.json()) as { findings: Finding[] }
    if (!Array.isArray(findings)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    purgeExpired()
    const id = generateId()
    store.set(id, { findings, createdAt: Date.now() })
    return NextResponse.json({ id })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const entry = store.get(id)
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(id)
    return NextResponse.json({ error: 'Expired' }, { status: 410 })
  }

  return NextResponse.json({ findings: entry.findings })
}
