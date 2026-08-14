import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SeverityBadge from '../SeverityBadge'
import FindingsTable from '../FindingsTable'
import ScanHeatmap from '../ScanHeatmap'
import SeverityDonut from '../SeverityDonut'
import SeverityTrendChart from '../SeverityTrendChart'
import CheckTrendChart from '../CheckTrendChart'
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

describe('ScanHeatmap Accessibility', () => {
  const mockEntries = [
    { date: new Date().toISOString(), findings: [] }
  ]

  it('renders inside figure and contains instructions', () => {
    render(<ScanHeatmap entries={mockEntries} />)
    expect(screen.getByRole('figure')).toBeInTheDocument()
    expect(screen.getByText(/scan activity heatmap grid/i)).toHaveClass('sr-only')
  })

  it('implements roving tabIndex and keydown events', () => {
    render(<ScanHeatmap entries={mockEntries} />)
    const cells = screen.getAllByRole('gridcell')
    expect(cells.length).toBeGreaterThan(0)

    // Verify only one cell has tabIndex=0
    const focusableCells = cells.filter(cell => cell.getAttribute('tabIndex') === '0')
    expect(focusableCells).toHaveLength(1)

    // Focused date cell keydown
    const activeCell = focusableCells[0]
    fireEvent.keyDown(activeCell, { key: 'ArrowLeft' })
    // Ensure state updates focusedDate roving index (or focused cell changes)
    const updatedFocusable = screen.getAllByRole('gridcell').filter(cell => cell.getAttribute('tabIndex') === '0')
    expect(updatedFocusable).toHaveLength(1)
  })
})

describe('Chart Accessibility and screen reader equivalents', () => {
  it('SeverityDonut wraps in figure and renders figcaption description', () => {
    const counts = { Critical: 1, High: 2, Medium: 0, Low: 0, Info: 0 }
    render(<SeverityDonut counts={counts} />)
    expect(screen.getByRole('figure')).toHaveAttribute('aria-label', 'Severity distribution chart')
    expect(screen.getByText(/Severity distribution donut chart/i)).toHaveClass('sr-only')
  })

  it('SeverityTrendChart wraps in figure and exposes data table', () => {
    const data = [{ date: '2026-07-10', High: 1, Medium: 2, Low: 0 }]
    render(<SeverityTrendChart data={data} />)
    expect(screen.getByRole('figure')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Severity Trend Data Table')).toBeInTheDocument()
  })

  it('CheckTrendChart wraps in figure and exposes data table', () => {
    const data = [{ date: '2026-07-10', count: 3 }]
    render(<CheckTrendChart data={data} checkName="overflow" />)
    expect(screen.getByRole('figure')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Trend Data for overflow')).toBeInTheDocument()
  })
})
