import { NextRequest, NextResponse } from 'next/server'

interface AuditRecord {
  id: string
  actor: string
  wallet: string | null
  action: string
  target: string
  timestamp: string
  metadata?: Record<string, string>
}

const TTL_MS = 30 * 24 * 60 * 60 * 1000
const TTL_S = 30 * 24 * 60 * 60

const memStore = new Map<string, AuditRecord[]>()

function getStoreKey(wallet: string | null): string {
  return wallet ? `audit:${wallet}` : 'audit:anonymous'
}

function memPurge() {
  const now = Date.now()
  for (const [key, entries] of memStore) {
    if (entries.length === 0 || entries.every(entry => now - Date.parse(entry.timestamp) > TTL_MS)) {
      memStore.delete(key)
    }
  }
}

async function storeAppend(wallet: string | null, record: AuditRecord): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    const key = getStoreKey(wallet)
    const existing = ((await kv.get<AuditRecord[]>(key)) ?? []) as AuditRecord[]
    await kv.set(key, [...existing, record], { ex: TTL_S })
    return
  }

  memPurge()
  const key = getStoreKey(wallet)
  const existing = memStore.get(key) ?? []
  memStore.set(key, [...existing, record])
}

async function storeList(wallet: string | null): Promise<AuditRecord[]> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    const key = getStoreKey(wallet)
    return ((await kv.get<AuditRecord[]>(key)) ?? []) as AuditRecord[]
  }

  memPurge()
  return memStore.get(getStoreKey(wallet)) ?? []
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AuditRecord>
    if (!body.action || !body.target || !body.timestamp || !body.actor) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const record: AuditRecord = {
      id: body.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      actor: body.actor,
      wallet: body.wallet ?? null,
      action: body.action,
      target: body.target,
      timestamp: body.timestamp,
      metadata: body.metadata,
    }

    await storeAppend(record.wallet, record)
    return NextResponse.json({ ok: true, id: record.id })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  const entries = await storeList(wallet)
  return NextResponse.json({ entries })
}
