import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isValidGistUrl, fetchGistFiles, fetchGistFileContent } from '../lib/gist'

const VALID_URL = 'https://gist.github.com/octocat/aa5a315d61ae9438b18d'
const GIST_ID = 'aa5a315d61ae9438b18d'

const mockApiResponse = {
  id: GIST_ID,
  files: {
    'hello.ts': {
      filename: 'hello.ts',
      language: 'TypeScript',
      raw_url: 'https://gist.githubusercontent.com/octocat/aa5a315d61ae9438b18d/raw/hello.ts',
    },
    'README.md': {
      filename: 'README.md',
      language: null,
      raw_url: 'https://gist.githubusercontent.com/octocat/aa5a315d61ae9438b18d/raw/README.md',
    },
  },
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('isValidGistUrl', () => {
  it('accepts a valid gist URL', () => {
    expect(isValidGistUrl(VALID_URL)).toBe(true)
  })

  it('accepts a URL with trailing slash', () => {
    expect(isValidGistUrl(`${VALID_URL}/`)).toBe(true)
  })

  it('rejects a non-gist GitHub URL', () => {
    expect(isValidGistUrl('https://github.com/octocat/hello-world')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidGistUrl('')).toBe(false)
  })

  it('rejects a URL with an invalid gist id (non-hex chars)', () => {
    expect(isValidGistUrl('https://gist.github.com/user/GGGG')).toBe(false)
  })

  it('strips whitespace before validating', () => {
    expect(isValidGistUrl(`  ${VALID_URL}  `)).toBe(true)
  })
})

describe('fetchGistFiles', () => {
  it('returns the gist id and file list', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchGistFiles(VALID_URL)
    expect(result.id).toBe(GIST_ID)
    expect(result.files).toHaveLength(2)
    expect(result.files.map(f => f.filename)).toEqual(
      expect.arrayContaining(['hello.ts', 'README.md']),
    )
  })

  it('calls the GitHub Gist API with the correct URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    })
    vi.stubGlobal('fetch', fetchMock)

    await fetchGistFiles(VALID_URL)
    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://api.github.com/gists/${GIST_ID}`,
    )
  })

  it('throws for an invalid gist URL', async () => {
    await expect(fetchGistFiles('https://not-a-gist.com')).rejects.toThrow(
      'Invalid Gist URL',
    )
  })

  it('throws a descriptive error on 404', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchGistFiles(VALID_URL)).rejects.toThrow('Gist not found')
  })

  it('throws a generic error for other non-ok statuses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchGistFiles(VALID_URL)).rejects.toThrow('GitHub API error 500')
  })

  it('maps null language correctly', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    })
    vi.stubGlobal('fetch', fetchMock)

    const { files } = await fetchGistFiles(VALID_URL)
    const readme = files.find(f => f.filename === 'README.md')
    expect(readme?.language).toBeNull()
  })
})

describe('fetchGistFileContent', () => {
  it('returns the raw file content', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'export const hello = "world"',
    })
    vi.stubGlobal('fetch', fetchMock)

    const content = await fetchGistFileContent(
      'https://gist.githubusercontent.com/octocat/raw/hello.ts',
    )
    expect(content).toBe('export const hello = "world"')
  })

  it('calls fetch with the provided rawUrl', async () => {
    const rawUrl = 'https://gist.githubusercontent.com/octocat/raw/hello.ts'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' })
    vi.stubGlobal('fetch', fetchMock)

    await fetchGistFileContent(rawUrl)
    expect(fetchMock.mock.calls[0][0]).toBe(rawUrl)
  })

  it('throws when the fetch fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403 })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchGistFileContent('https://gist.githubusercontent.com/octocat/raw/hello.ts'),
    ).rejects.toThrow('Failed to fetch gist file: 403')
  })
})
