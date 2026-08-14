export type AuditAction = 'export' | 'notify' | 'attest'

export interface AuditEvent {
  id: string
  actor: string
  wallet: string | null
  action: AuditAction
  target: string
  timestamp: string
  metadata?: Record<string, string>
}

interface BuildAuditEventOptions {
  wallet?: string | null
  action: AuditAction
  target: string
  metadata?: Record<string, unknown>
}

const SENSITIVE_KEYS = new Set(['token', 'secret', 'password', 'apikey', 'webhookurl', 'hook', 'authorization', 'cookie', 'set-cookie'])

function isSensitiveValue(key: string, value: unknown): boolean {
  const normalized = key.toLowerCase()
  if (SENSITIVE_KEYS.has(normalized)) return true
  if (normalized.includes('token') || normalized.includes('secret') || normalized.includes('password') || normalized.includes('auth') || normalized.includes('webhook')) {
    return true
  }
  if (typeof value === 'string' && /https?:\/\/[\w.-]+/.test(value)) {
    return normalized.includes('url') || normalized.includes('link') || normalized.includes('endpoint')
  }
  return false
}

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, string> | undefined {
  if (!metadata) return undefined

  const safeEntries: Record<string, string> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (isSensitiveValue(key, value)) continue
    if (typeof value === 'string') {
      safeEntries[key] = value
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      safeEntries[key] = String(value)
    } else if (value === undefined || value === null) {
      safeEntries[key] = ''
    } else {
      safeEntries[key] = JSON.stringify(value)
    }
  }
  return Object.keys(safeEntries).length ? safeEntries : undefined
}

export function buildAuditEvent({ wallet, action, target, metadata }: BuildAuditEventOptions): AuditEvent {
  const actor = wallet?.trim() || 'anonymous'
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    actor,
    wallet: wallet?.trim() || null,
    action,
    target,
    timestamp: new Date().toISOString(),
    metadata: sanitizeMetadata(metadata),
  }
}

export async function logAuditEvent(options: BuildAuditEventOptions): Promise<void> {
  const event = buildAuditEvent(options)
  try {
    await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
  } catch {
    // Swallow logging failures so the main action can still proceed.
  }
}
