import React from 'react'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { Finding } from '@/types/findings'
import { encodeWorkspace } from '@/lib/share'

const mockReplace = jest.fn()
let mockToken = ''

jest.mock('next/navigation', () => ({
  useParams: () => ({ token: mockToken }),
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
}))
jest.mock('@/components/FindingsTable', () => ({ __esModule: true, default: ({ findings }: { findings: Finding[] }) => <ul>{findings.map((f, i) => <li key={i}>{f.check_name}</li>)}</ul> }))
jest.mock('@/components/EmptyState', () => ({ __esModule: true, default: ({ onScanAnother }: { onScanAnother: () => void }) => <button onClick={onScanAnother}>Scan another</button> }))
jest.mock('@/components/SeverityBadge', () => ({ __esModule: true, default: ({ severity }: { severity: string }) => <span>{severity}</span> }))
jest.mock('@/components/ThemeToggle', () => ({ __esModule: true, default: () => <button>theme</button> }))

import WorkspacePage from './page'

const finding: Finding = {
  check_name: 'missing-auth',
  severity: 'High',
  file_path: 'src/lib.rs',
  line: 5,
  function_name: 'transfer',
  description: 'No auth check.',
}

describe('WorkspacePage', () => {
  beforeEach(() => { mockReplace.mockClear() })

  it('decodes token and renders findings', async () => {
    mockToken = encodeWorkspace('my-contract', [finding])
    await act(async () => { render(<WorkspacePage />) })
    expect(screen.getByText('missing-auth')).toBeInTheDocument()
  })

  it('shows finding count', async () => {
    mockToken = encodeWorkspace('my-contract', [finding])
    await act(async () => { render(<WorkspacePage />) })
    expect(screen.getByText(/1 finding detected/i)).toBeInTheDocument()
  })

  it('redirects to / for invalid token', async () => {
    mockToken = 'not-valid-base64!!!'
    await act(async () => { render(<WorkspacePage />) })
    expect(mockReplace).toHaveBeenCalledWith('/')
  })

  it('shows empty state when findings is empty', async () => {
    mockToken = encodeWorkspace('clean-contract', [])
    await act(async () => { render(<WorkspacePage />) })
    expect(screen.getByText(/no issues detected/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /scan another/i })).toBeInTheDocument()
  })

  it('shows "Shared workspace" badge', async () => {
    mockToken = encodeWorkspace('my-contract', [finding])
    await act(async () => { render(<WorkspacePage />) })
    expect(screen.getByText('Shared workspace')).toBeInTheDocument()
  })
})
