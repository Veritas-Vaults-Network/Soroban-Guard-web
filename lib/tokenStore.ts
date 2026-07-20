/**
 * Token access control design:
 *
 * ## Revocation
 * Tokens can be explicitly revoked via POST /api/token/revoke before natural expiry.
 * Revoked tokens are stored (hashed) in KV or in-memory and checked on every access.
 *
 * ## Scoped permission levels
 * Current model: single permission level (full read access).
 *
 * Design consideration — scoped permissions were considered but intentionally omitted:
 *
 * - Workspace tokens are self-contained (findings are base64-encoded in the URL).
 *   The token IS the data — true scope enforcement is impossible because any
 *   recipient can decode the payload offline. Adding "view-only" vs "full-access"
 *   would be meaningless since there is no server-side data to gate.
 *
 * - Webhook tokens reference server-side data with a 1-hour TTL. In principle,
 *   scopes like "read-only" and "admin" (ability to trigger rescans) could be
 *   attached at creation time. However, the app has no user-account system, so
 *   there is no way to authenticate who performs a scoped action. Adding scopes
 *   without authentication would create a false sense of security.
 *
 * If user accounts are added in the future, scoped tokens should be revisited:
 *   - `read` — view findings (current default)
 *   - `write` — create new webhook payloads / trigger rescans
 *   - `admin` — revoke tokens, manage permissions
 *
 * ## Token leak prevention
 * - Referrer-Policy: no-referrer is set globally in next.config.js
 * - CSP frame-ancestors 'none' prevents embedded access
 * - Tokens are never logged server-side
 * - hashToken uses a non-reversible digest (not the raw token) for KV keys
 */
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
