import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createIssuesForFindings } from '../lib/githubExport'
import type { Finding } from '../types/findings'

const mockFinding: Finding = {
  check_name: 'reentrancy',
  severity: 'Critical',
  file_path: 'src/contract.rs',
  line: 42,
  function_name: 'transfer',
  description: 'Potential reentrancy vulnerability',
  remediation: 'Use checks-effects-interactions pattern',
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('ensureLabel (via createIssuesForFindings)', () => {
  it('calls the labels endpoint for each unique severity', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ html_url: 'https://github.com/o/r/issues/1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await createIssuesForFindings([mockFinding], 'owner', 'repo', 'token', vi.fn())

    const labelCalls = fetchMock.mock.calls.filter(([url]) =>
      (url as string).includes('/labels'),
    )
    expect(labelCalls.length).toBe(1)
    expect(labelCalls[0][0]).toBe('https://api.github.com/repos/owner/repo/labels')
    expect(JSON.parse(labelCalls[0][1].body)).toMatchObject({ name: 'Critical' })
  })

  it('ignores 422 when label already exists', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if ((url as string).includes('/labels')) {
        return Promise.resolve({ ok: false, status: 422, json: async () => ({}) })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ html_url: 'https://github.com/o/r/issues/1' }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createIssuesForFindings([mockFinding], 'owner', 'repo', 'token', vi.fn()),
    ).resolves.toEqual(['https://github.com/o/r/issues/1'])
  })
})

describe('createIssuesForFindings', () => {
  it('returns html_urls for each created issue', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ html_url: 'https://github.com/o/r/issues/1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const progress = vi.fn()
    const urls = await createIssuesForFindings(
      [mockFinding],
      'owner',
      'repo',
      'token',
      progress,
    )

    expect(urls).toEqual(['https://github.com/o/r/issues/1'])
    expect(progress).toHaveBeenCalledWith(1, 1)
  })

  it('includes remediation in body when present', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ html_url: 'https://github.com/o/r/issues/2' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await createIssuesForFindings([mockFinding], 'owner', 'repo', 'token', vi.fn())

    const issueCalls = fetchMock.mock.calls.filter(([url]) =>
      (url as string).includes('/issues') && !(url as string).includes('/labels'),
    )
    const body = JSON.parse(issueCalls[0][1].body)
    expect(body.body).toContain('Remediation')
    expect(body.body).toContain('Use checks-effects-interactions pattern')
  })

  it('omits remediation block when not present', async () => {
    const findingNoRem: Finding = { ...mockFinding, remediation: undefined }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ html_url: 'https://github.com/o/r/issues/3' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await createIssuesForFindings([findingNoRem], 'owner', 'repo', 'token', vi.fn())

    const issueCalls = fetchMock.mock.calls.filter(([url]) =>
      (url as string).includes('/issues') && !(url as string).includes('/labels'),
    )
    expect(JSON.parse(issueCalls[0][1].body).body).not.toContain('Remediation')
  })

  it('throws when GitHub API returns an error', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if ((url as string).includes('/labels')) {
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }
      return Promise.resolve({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      createIssuesForFindings([mockFinding], 'owner', 'repo', 'token', vi.fn()),
    ).rejects.toThrow('Forbidden')
  })

  it('calls onProgress for every finding', async () => {
    const findings: Finding[] = [
      mockFinding,
      { ...mockFinding, check_name: 'overflow', severity: 'High' },
    ]
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ html_url: 'https://github.com/o/r/issues/1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const progress = vi.fn()
    await createIssuesForFindings(findings, 'owner', 'repo', 'token', progress)

    expect(progress).toHaveBeenCalledTimes(2)
    expect(progress).toHaveBeenNthCalledWith(1, 1, 2)
    expect(progress).toHaveBeenNthCalledWith(2, 2, 2)
  })
})
