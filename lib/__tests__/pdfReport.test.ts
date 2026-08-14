import { computeSeverityCounts, sortBySeverity, buildReportConfig, generatePdfReport } from '../pdfReport'
import type { Finding } from '@/types/findings'

const makeFindings = (): Finding[] => [
  { check_name: 'reentrancy', severity: 'Critical', file_path: 'src/lib.rs', line: 10, function_name: 'withdraw', description: 'Critical reentrancy' },
  { check_name: 'overflow', severity: 'High', file_path: 'src/lib.rs', line: 20, function_name: 'add', description: 'Potential overflow' },
  { check_name: 'unused', severity: 'Low', file_path: 'src/util.rs', line: 5, function_name: 'helper', description: 'Unused variable' },
  { check_name: 'info', severity: 'Info', file_path: 'src/lib.rs', line: 1, function_name: 'init', description: 'Informational' },
]

describe('computeSeverityCounts', () => {
  it('counts each severity level', () => {
    const findings = makeFindings()
    const counts = computeSeverityCounts(findings)
    expect(counts.Critical).toBe(1)
    expect(counts.High).toBe(1)
    expect(counts.Medium).toBe(0)
    expect(counts.Low).toBe(1)
    expect(counts.Info).toBe(1)
  })

  it('returns zeros for empty array', () => {
    const counts = computeSeverityCounts([])
    expect(counts).toEqual({ Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 })
  })
})

describe('sortBySeverity', () => {
  it('sorts Critical before High before Low', () => {
    const findings = makeFindings()
    const sorted = sortBySeverity(findings)
    expect(sorted[0].severity).toBe('Critical')
    expect(sorted[1].severity).toBe('High')
    expect(sorted[sorted.length - 1].severity).toBe('Info')
  })

  it('returns empty array for empty input', () => {
    expect(sortBySeverity([])).toEqual([])
  })
})

describe('buildReportConfig', () => {
  it('returns a config with all default sections', () => {
    const meta = { source: 'contract', scannedAt: '2024-01-01T00:00:00Z', score: 80 }
    const config = buildReportConfig(makeFindings(), meta)
    expect(config.sections).toHaveLength(4)
    expect(config.sections.map(s => s.type)).toEqual(['cover', 'summary', 'findings', 'footer'])
    expect(config.metadata).toBe(meta)
    expect(config.findings).toHaveLength(4)
  })
})

describe('generatePdfReport', () => {
  const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)

  afterEach(() => openSpy.mockClear())

  it('opens /report with encoded findings', () => {
    const findings = makeFindings()
    const meta = { source: 'my-contract', scannedAt: '2024-01-01T00:00:00Z', score: 75 }
    generatePdfReport(findings, meta)
    expect(openSpy).toHaveBeenCalledTimes(1)
    const url = openSpy.mock.calls[0][0] as string
    expect(url).toContain('/report?')
    expect(url).toContain('source=my-contract')
    expect(url).toContain('score=75')
  })

  it('includes wallet address when provided', () => {
    const meta = { source: 'c', scannedAt: '2024-01-01T00:00:00Z', score: 100, walletAddress: 'GABC...' }
    generatePdfReport([], meta)
    const url = openSpy.mock.calls[0][0] as string
    expect(url).toContain('wallet=GABC...')
  })

  it('omits wallet param when not provided', () => {
    const meta = { source: 'c', scannedAt: '2024-01-01T00:00:00Z', score: 50 }
    generatePdfReport([], meta)
    const url = openSpy.mock.calls[0][0] as string
    expect(url).not.toContain('wallet=')
  })
})
