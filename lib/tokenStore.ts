const KV_PREFIX_REVOKED = 'token_revoked:'

const memRevoked = new Set<string>()

function hashToken(token: string): string {
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return `h${Math.abs(hash).toString(36)}`
}

async function kvDel(key: string): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    await kv.del(key)
  }
}

async function kvGet(key: string): Promise<unknown> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    return kv.get(key)
  }
  return null
}

async function kvSet(key: string, value: unknown): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    await kv.set(key, value)
  }
}

export async function revokeToken(token: string): Promise<void> {
  const key = `${KV_PREFIX_REVOKED}${hashToken(token)}`
  if (process.env.KV_REST_API_URL) {
    await kvSet(key, { revoked: true, revokedAt: Date.now() })
  } else {
    memRevoked.add(key)
  }
}

export async function isTokenRevoked(token: string): Promise<boolean> {
  const key = `${KV_PREFIX_REVOKED}${hashToken(token)}`
  if (process.env.KV_REST_API_URL) {
    const entry = await kvGet(key) as { revoked: boolean } | null
    return entry?.revoked === true
  }
  return memRevoked.has(key)
}

export { hashToken }
