import { revokeToken, isTokenRevoked, hashToken } from '../tokenStore'

describe('tokenStore', () => {
  beforeEach(() => {
    delete process.env.KV_REST_API_URL
  })

  describe('hashToken', () => {
    it('returns a deterministic hash for the same token', () => {
      const a = hashToken('test-token-123')
      const b = hashToken('test-token-123')
      expect(a).toBe(b)
    })

    it('returns different hashes for different tokens', () => {
      const a = hashToken('token-a')
      const b = hashToken('token-b')
      expect(a).not.toBe(b)
    })

    it('returns a string prefixed with h', () => {
      const result = hashToken('anything')
      expect(result).toMatch(/^h[a-z0-9]+$/)
    })
  })

  describe('revokeToken and isTokenRevoked (in-memory)', () => {
    it('returns false for a token that was not revoked', async () => {
      const revoked = await isTokenRevoked('never-revoked')
      expect(revoked).toBe(false)
    })

    it('returns true after revoking a token', async () => {
      await revokeToken('my-token')
      const revoked = await isTokenRevoked('my-token')
      expect(revoked).toBe(true)
    })

    it('does not affect other tokens when one is revoked', async () => {
      await revokeToken('token-to-revoke')
      const revokedOther = await isTokenRevoked('other-token')
      expect(revokedOther).toBe(false)
    })

    it('revoking the same token twice is idempotent', async () => {
      await revokeToken('double-revoke')
      await revokeToken('double-revoke')
      const revoked = await isTokenRevoked('double-revoke')
      expect(revoked).toBe(true)
    })
  })
})
