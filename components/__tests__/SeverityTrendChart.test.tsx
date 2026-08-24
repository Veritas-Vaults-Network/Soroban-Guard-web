import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SeverityTrendChart from '../SeverityTrendChart'
import type { ContractScanRecord } from '@/types/stellar'

describe('SeverityTrendChart Accessibility and Rendering', () => {
  const mockRecords: ContractScanRecord[] = [
    {
      schemaVersion: 1,
      id: '101',
      publicKey: 'GABC...',
      contractId: 'CCONTRACT123',
      network: 'testnet',
      scannedAt: '2026-01-01T10:00:00Z',
      findingCount: 5,
      highCount: 2,
      mediumCount: 2,
      lowCount: 1,
      findings: [],
      score: 60,
    },
    {
      schemaVersion: 1,
      id: '102',
      publicKey: 'GABC...',
      contractId: 'CCONTRACT123',
      network: 'testnet',
      scannedAt: '2026-01-02T10:00:00Z',
      findingCount: 2,
      highCount: 0,
      mediumCount: 1,
      lowCount: 1,
      findings: [],
      score: 85,
    },
  ]

  it('renders correctly with zero scans (empty state)', () => {
    render(<SeverityTrendChart records={[]} contractId="CCONTRACT123" />)
    const figure = screen.getByRole('figure')
    expect(figure).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Severity trend over time')
    )
    expect(
      screen.getByText(/No scan history recorded for this contract yet/i)
    ).toBeInTheDocument()
  })

  it('renders correctly with one scan and includes screen-reader table', () => {
    render(<SeverityTrendChart records={[mockRecords[0]]} contractId="CCONTRACT123" />)
    const figure = screen.getByRole('figure')
    expect(figure).toBeInTheDocument()
    const table = screen.getByRole('table', { hidden: true })
    expect(table).toBeInTheDocument()
    expect(table.querySelector('caption')).toHaveTextContent('Detailed security scan finding counts over time for contract CCONTRAC…ACT123')
  })

  it('renders correctly with multiple scans, legend, and screen-reader equivalent data table', () => {
    render(<SeverityTrendChart records={mockRecords} contractId="CCONTRACT123" />)
    
    // Check figure wrapper with descriptive aria-label
    const figure = screen.getByRole('figure')
    expect(figure).toBeInTheDocument()

    // Check legend items (High, Medium, Low with shape indicators)
    expect(screen.getByText('High (Circle)')).toBeInTheDocument()
    expect(screen.getByText('Medium (Square)')).toBeInTheDocument()
    expect(screen.getByText('Low (Triangle)')).toBeInTheDocument()

    // Check visually-hidden data table (screen-reader equivalent)
    const table = screen.getByRole('table', { hidden: true })
    expect(table).toHaveClass('sr-only')

    const rows = screen.getAllByRole('row', { hidden: true })
    // 1 header row + 2 data rows = 3 rows
    expect(rows.length).toBe(3)
  })
})
