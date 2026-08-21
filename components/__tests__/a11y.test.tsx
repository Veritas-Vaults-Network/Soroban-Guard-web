import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SeverityBadge from '../SeverityBadge'
import FindingsTable from '../FindingsTable'
import type { Finding } from '@/types/findings'

// Mock matchMedia for JSDOM
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
})

// Mock Recharts since it does not render properly in JSDOM environment without dimensions
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

describe('SeverityBadge Accessibility', () => {
  it('announces severity correctly via aria-label and does not have status role', () => {
    render(<SeverityBadge severity="High" />)
    const badge = screen.getByLabelText('High severity')
    expect(badge).toBeInTheDocument()
    expect(badge).not.toHaveAttribute('role', 'status')
  })
})

describe('FindingsTable Accessibility', () => {
  const mockFindings: Finding[] = [
    {
      check_name: 'unchecked-auth',
      severity: 'High',
      file_path: 'src/lib.rs',
      line: 10,
      function_name: 'transfer',
      description: 'Missing authority check',
    },
    {
      check_name: 'integer-overflow',
      severity: 'Medium',
      file_path: 'src/token.rs',
      line: 25,
      function_name: 'mint',
      description: 'Potential overflow',
    },
  ]

  it('exposes correct table/row/columnheader/cell roles', () => {
    render(<FindingsTable findings={mockFindings} />)
    expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Scan findings')
    expect(screen.getAllByRole('row').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('cell').length).toBeGreaterThan(0)
  })

  it('renders sort state aria-sort attribute on column headers', () => {
    render(<FindingsTable findings={mockFindings} />)
    const headers = screen.getAllByRole('columnheader')
    // Severity header button has aria-sort
    const severityHeader = headers.find(h => h.textContent?.includes('Severity'))
    expect(severityHeader).toHaveAttribute('aria-sort')
  })

  it('avoids duplicate severity text announcements', () => {
    render(<FindingsTable findings={mockFindings} />)
    // The visual plain-text span inside the cell has aria-hidden
    const hiddenLabels = screen.getAllByText('High', { selector: 'span' })
    const hiddenLabel = hiddenLabels.find(label => label.getAttribute('aria-hidden') === 'true')
    expect(hiddenLabel).toBeInTheDocument()
  })
})
