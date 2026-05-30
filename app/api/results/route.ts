import { NextRequest, NextResponse } from 'next/server'
import type { Finding } from '@/types/findings'
import { requireApiKey } from '@/lib/apiAuth'

interface StoredResult {
  findings: Finding[]
  createdAt: number
}

const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const TTL_S = 30 * 24 * 60 * 60

function generateId(): string {
  return Math.random().toString(36).slice(2, 8)
}

// In-memory fallback (used when KV_REST_API_URL is not configured)
const memStore = new Map<string, StoredResult>()

function memPurge() {
  const now = Date.now()
  for (const [k, v] of memStore) {
    if (now - v.createdAt > TTL_MS) memStore.delete(k)
  }
}

async function storeGet(id: string): Promise<StoredResult | null> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    return kv.get<StoredResult>(`results:${id}`)
  }
  return memStore.get(id) ?? null
}

async function storeSet(id: string, value: StoredResult): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    await kv.set(`results:${id}`, value, { ex: TTL_S })
  } else {
    memPurge()
    memStore.set(id, value)
  }
}

async function storeDel(id: string): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    await kv.del(`results:${id}`)
  } else {
    memStore.delete(id)
  }
}

export async function POST(req: NextRequest) {
  const authError = requireApiKey(req)
  if (authError) return authError

  try {
    const { findings } = (await req.json()) as { findings: Finding[] }
    if (!Array.isArray(findings)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const id = generateId()
    await storeSet(id, { findings, createdAt: Date.now() })
    return NextResponse.json({ id })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const authError = requireApiKey(req)
  if (authError) return authError

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const entry = await storeGet(id)
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (Date.now() - entry.createdAt > TTL_MS) {
    await storeDel(id)
    return NextResponse.json({ error: 'Expired' }, { status: 410 })
  }

  return NextResponse.json({ findings: entry.findings })
}
