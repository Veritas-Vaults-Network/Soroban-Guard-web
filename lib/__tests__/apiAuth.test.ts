import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { requireCronSecret } from '../apiAuth'
import { POST, GET } from '@/app/api/cron/scan/route'

describe('requireCronSecret & cron route authentication', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('allows access when no secret is configured (local dev)', () => {
    delete process.env.CRON_SECRET
    delete process.env.API_SECRET_KEY

    const req = new NextRequest('http://localhost:3000/api/cron/scan')
    expect(requireCronSecret(req)).toBeNull()
  })

  it('rejects unauthenticated request when CRON_SECRET is set', async () => {
    process.env.CRON_SECRET = 'my-super-secret'

    const req = new NextRequest('http://localhost:3000/api/cron/scan', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toContain('Unauthorized')
  })

  it('accepts request with valid Authorization Bearer header', async () => {
    process.env.CRON_SECRET = 'my-super-secret'

    const req = new NextRequest('http://localhost:3000/api/cron/scan', {
      method: 'POST',
      headers: {
        authorization: 'Bearer my-super-secret',
      },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('ok')
  })

  it('accepts request with valid X-Cron-Secret header', async () => {
    process.env.CRON_SECRET = 'my-super-secret'

    const req = new NextRequest('http://localhost:3000/api/cron/scan', {
      method: 'GET',
      headers: {
        'x-cron-secret': 'my-super-secret',
      },
    })

    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('ok')
  })
})
