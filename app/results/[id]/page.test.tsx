import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { Finding } from '@/types/findings'

// Must mock before importing the page
const mockNotFound = jest.fn()
jest.mock('next/navigation', () => ({ notFound: () => { mockNotFound(); throw new Error('NEXT_NOT_FOUND') } }))
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }))
jest.mock('@/components/FindingsTable', () => ({ __esModule: true, default: ({ findings }: { findings: Finding[] }) => <ul>{findings.map((f, i) => <li key={i}>{f.check_name}</li>)}</ul> }))
jest.mock('@/components/SeverityBadge', () => ({ __esModule: true, default: ({ severity }: { severity: string }) => <span>{severity}</span> }))
jest.mock('@/components/ThemeToggle', () => ({ __esModule: true, default: () => <button>theme</button> }))

const mockFetch = jest.fn()
global.fetch = mockFetch

const finding: Finding = {
  check_name: 'unsafe-math',
  severity: 'High',
  file_path: 'src/lib.rs',
  line: 10,
  function_name: 'add',
  description: 'Potential overflow.',
}

function mockOkResponse(findings: Finding[]) {
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ findings }) })
}

async function renderPage(id: string) {
  const { default: PermalinkPage } = await import('./page')
  const jsx = await PermalinkPage({ params: { id } })
  render(jsx as React.ReactElement)
}

describe('getFindings', () => {
  beforeEach(() => { mockFetch.mockReset(); jest.resetModules() })

  it('fetches findings and renders them', async () => {
    mockOkResponse([finding])
    await renderPage('abc123')
    expect(screen.getByText('unsafe-math')).toBeInTheDocument()
  })

  it('shows finding count in heading', async () => {
    mockOkResponse([finding])
    await renderPage('abc123')
    expect(screen.getByText(/1 finding detected/i)).toBeInTheDocument()
  })

  it('shows empty state when findings is empty', async () => {
    mockOkResponse([])
    await renderPage('abc123')
    expect(screen.getByText(/no issues detected/i)).toBeInTheDocument()
  })

  it('calls notFound when fetch returns non-ok', async () => {
    mockFetch.mockResolvedValue({ ok: false })
    await expect(renderPage('bad-id')).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mockNotFound).toHaveBeenCalled()
  })

  it('calls notFound when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network error'))
    await expect(renderPage('bad-id')).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mockNotFound).toHaveBeenCalled()
  })
})

describe('generateMetadata', () => {
  beforeEach(() => { mockFetch.mockReset(); jest.resetModules() })

  it('returns title with finding count', async () => {
    mockOkResponse([finding])
    const { generateMetadata } = await import('./page')
    const meta = await generateMetadata({ params: { id: 'abc' } })
    expect(meta.title).toBe('Soroban Guard Scan — 1 findings')
  })

  it('returns not-found title when fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false })
    const { generateMetadata } = await import('./page')
    const meta = await generateMetadata({ params: { id: 'bad' } })
    expect(meta.title).toBe('Soroban Guard — Results Not Found')
  })

  it('includes severity counts in description', async () => {
    mockOkResponse([finding])
    const { generateMetadata } = await import('./page')
    const meta = await generateMetadata({ params: { id: 'abc' } })
    expect(meta.description).toMatch(/High: 1/)
  })
})
