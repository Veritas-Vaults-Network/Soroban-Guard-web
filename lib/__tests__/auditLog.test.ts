import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildAuditEvent, logAuditEvent } from '../auditLog'

describe('buildAuditEvent', () => {
  it('creates a safe event payload with wallet and target only', () => {
    const event = buildAuditEvent({
      wallet: 'GB...123',
      action: 'notify',
      target: 'discord',
      metadata: { webhookUrl: 'https://example.com/hook', apiKey: 'secret-token' },
    })

    expect(event).toMatchObject({
      actor: 'GB...123',
      wallet: 'GB...123',
      action: 'notify',
      target: 'discord',
    })
    expect(event.timestamp).toBeTruthy()
    expect(JSON.stringify(event)).not.toContain('https://example.com/hook')
    expect(JSON.stringify(event)).not.toContain('secret-token')
  })
})

describe('logAuditEvent', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    global.fetch = originalFetch
  })

  it('posts a sanitized event to the audit API', async () => {
    const fetchMock = vi.mocked(global.fetch)

    await logAuditEvent({
      wallet: 'GB...123',
      action: 'export',
      target: 'json',
      metadata: { webhookUrl: 'https://example.com/hook' },
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/audit', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }))

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body).toMatchObject({
      actor: 'GB...123',
      wallet: 'GB...123',
      action: 'export',
      target: 'json',
    })
    expect(JSON.stringify(body)).not.toContain('https://example.com/hook')
  })
})
