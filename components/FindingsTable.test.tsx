import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FindingsTable from './FindingsTable'
import type { Finding } from '@/types/findings'

// Lightweight stubs for sub-components
vi.mock('./SeverityBadge', () => ({
  default: ({ severity }: { severity: string }) => <span data-testid="severity-badge">{severity}</span>,
}))
vi.mock('./FindingCard', () => ({
  default: ({ finding }: { finding: Finding }) => (
    <div data-testid="finding-card">{finding.check_name}</div>
  ),
}))
vi.mock('./BottomSheet', () => ({
  default: ({ open, children, title, onClose }: { open: boolean; children: React.ReactNode; title: string; onClose: () => void }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))
vi.mock('./CheckTooltip', () => ({
  default: ({ checkName }: { checkName: string }) => <span>{checkName}</span>,
}))

const makeFinding = (overrides: Partial<Finding> = {}): Finding => ({
  check_name: 'unchecked-auth',
  severity: 'High',
  file_path: 'src/lib.rs',
  line: 42,
  function_name: 'transfer',
  description: 'Authorization not verified.',
  ...overrides,
})

const FINDINGS: Finding[] = [
  makeFinding({ check_name: 'unchecked-auth', severity: 'High', description: 'Auth issue' }),
  makeFinding({ check_name: 'integer-overflow', severity: 'Medium', description: 'Overflow risk' }),
  makeFinding({ check_name: 'info-leak', severity: 'Low', description: 'Info leak' }),
]

describe('FindingsTable', () => {
  describe('empty state', () => {
    it('shows "No findings match your search" when searchQuery filters everything out', () => {
      render(<FindingsTable findings={FINDINGS} searchQuery="zzznomatch" />)
      expect(screen.getByText('No findings match your search.')).toBeInTheDocument()
    })

    it('renders rows when findings are present', () => {
      render(<FindingsTable findings={FINDINGS} />)
      expect(screen.queryByText('No findings match your search.')).not.toBeInTheDocument()
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(FINDINGS.length)
    })
  })

  describe('severity filtering via searchQuery', () => {
    it('shows only findings matching the search query', () => {
      render(<FindingsTable findings={FINDINGS} searchQuery="overflow" />)
      // Component renders mobile + desktop layouts, so check_name appears twice per finding
      expect(screen.getAllByText('integer-overflow').length).toBeGreaterThan(0)
      expect(screen.queryAllByText('unchecked-auth')).toHaveLength(0)
    })

    it('matches on description text', () => {
      render(<FindingsTable findings={FINDINGS} searchQuery="auth issue" />)
      expect(screen.getAllByText('unchecked-auth').length).toBeGreaterThan(0)
      expect(screen.queryAllByText('integer-overflow')).toHaveLength(0)
    })
  })

  describe('severity sort order', () => {
    it('renders High before Medium before Low', () => {
      render(<FindingsTable findings={[...FINDINGS].reverse()} />)
      // Each finding renders in both mobile and desktop layouts; take every other badge
      const badges = screen.getAllByTestId('severity-badge').map(el => el.textContent)
      // Deduplicate consecutive pairs (mobile + desktop render same badge twice per row)
      const unique = badges.filter((_, i) => i % 2 === 0)
      expect(unique).toEqual(['High', 'Medium', 'Low'])
    })
  })

  describe('row expansion', () => {
    it('does not show FindingCard before a row is clicked', () => {
      render(<FindingsTable findings={FINDINGS} />)
      expect(screen.queryByTestId('finding-card')).not.toBeInTheDocument()
    })

    it('expands a row and shows FindingCard on click', async () => {
      const user = userEvent.setup()
      render(<FindingsTable findings={FINDINGS} />)

      const rows = screen.getAllByRole('button', { name: /unchecked-auth|integer-overflow|info-leak/i })
      // Click the first row button (the one containing 'unchecked-auth')
      const firstRow = rows.find(btn => btn.textContent?.includes('unchecked-auth'))!
      await user.click(firstRow)

      const card = screen.getByTestId('finding-card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveTextContent('unchecked-auth')
    })

    it('collapses an expanded row on second click', async () => {
      const user = userEvent.setup()
      render(<FindingsTable findings={FINDINGS} />)

      const rows = screen.getAllByRole('button')
      const firstRow = rows.find(btn => btn.textContent?.includes('unchecked-auth'))!

      await user.click(firstRow)
      expect(screen.getByTestId('finding-card')).toBeInTheDocument()

      await user.click(firstRow)
      expect(screen.queryByTestId('finding-card')).not.toBeInTheDocument()
    })

    it('sets aria-expanded=true on the expanded row', async () => {
      const user = userEvent.setup()
      render(<FindingsTable findings={FINDINGS} />)

      const rows = screen.getAllByRole('button')
      const firstRow = rows.find(btn => btn.textContent?.includes('unchecked-auth'))!

      expect(firstRow).toHaveAttribute('aria-expanded', 'false')
      await user.click(firstRow)
      expect(firstRow).toHaveAttribute('aria-expanded', 'true')
    })

    it('expands via forceExpandedIndex prop', () => {
      render(<FindingsTable findings={FINDINGS} forceExpandedIndex={0} />)
      expect(screen.getByTestId('finding-card')).toBeInTheDocument()
    })
  })

  describe('keyboard navigation', () => {
    it('expands a row with Enter key', async () => {
      const user = userEvent.setup()
      render(<FindingsTable findings={FINDINGS} />)

      const rows = screen.getAllByRole('button')
      const firstRow = rows.find(btn => btn.textContent?.includes('unchecked-auth'))!
      firstRow.focus()
      await user.keyboard('{Enter}')

      expect(screen.getByTestId('finding-card')).toBeInTheDocument()
    })

    it('expands a row with Space key', async () => {
      const user = userEvent.setup()
      render(<FindingsTable findings={FINDINGS} />)

      const rows = screen.getAllByRole('button')
      const firstRow = rows.find(btn => btn.textContent?.includes('unchecked-auth'))!
      firstRow.focus()
      await user.keyboard(' ')

      expect(screen.getByTestId('finding-card')).toBeInTheDocument()
    })
  })
})
