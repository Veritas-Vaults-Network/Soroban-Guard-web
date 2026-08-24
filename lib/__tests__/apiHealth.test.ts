import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkApiHealth, getApiBaseUrl } from '../api'
import { checkBackendReachability } from '../env'

describe('getApiBaseUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('process', { env: {} })
  })

  it('returns localhost when NEXT_PUBLIC_API_URL is unset', () => {
    expect(getApiBaseUrl()).toBe('http://localhost:3001')
  })

  it('strips trailing slash from configured URL', () => {
    vi.stubGlobal('process', { env: { NEXT_PUBLIC_API_URL: 'https://api.example.com/' } })
    expect(getApiBaseUrl()).toBe('https://api.example.com')
  })

  it('returns URL as-is when no trailing slash', () => {
    vi.stubGlobal('process', { env: { NEXT_PUBLIC_API_URL: 'https://api.example.com' } })
    expect(getApiBaseUrl()).toBe('https://api.example.com')
  })
})

describe('checkApiHealth', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('process', { env: { NEXT_PUBLIC_API_URL: 'https://api.example.com' } })
  })

  it('returns true when /health responds 200', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)
    expect(await checkApiHealth()).toBe(true)
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/health', expect.anything())
  })

  it('returns false when /health responds non-2xx', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)
    expect(await checkApiHealth()).toBe(false)
  })

  it('returns false when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))
    expect(await checkApiHealth()).toBe(false)
  })
})

describe('checkBackendReachability', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns warning when NEXT_PUBLIC_API_URL is missing', async () => {
    vi.stubGlobal('process', { env: {} })
    const result = await checkBackendReachability()
    expect(result).toContain('NEXT_PUBLIC_API_URL is not configured')
  })

  it('returns warning when NEXT_PUBLIC_API_URL is malformed', async () => {
    vi.stubGlobal('process', { env: { NEXT_PUBLIC_API_URL: 'not-a-url' } })
    const result = await checkBackendReachability()
    expect(result).toContain('malformed')
  })

  it('returns warning when /health is unreachable', async () => {
    vi.stubGlobal('process', { env: { NEXT_PUBLIC_API_URL: 'https://api.example.com' } })
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))
    const result = await checkBackendReachability()
    expect(result).toBe('The scanner backend is unavailable.')
  })

  it('returns warning when /health returns non-2xx', async () => {
    vi.stubGlobal('process', { env: { NEXT_PUBLIC_API_URL: 'https://api.example.com' } })
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as Response)
    const result = await checkBackendReachability()
    expect(result).toContain('status 500')
  })

  it('returns null when backend is healthy', async () => {
    vi.stubGlobal('process', { env: { NEXT_PUBLIC_API_URL: 'https://api.example.com' } })
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)
    const result = await checkBackendReachability()
    expect(result).toBeNull()
  })
})
