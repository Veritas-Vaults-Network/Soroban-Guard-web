import { filterFindings, type FilterState } from '@/lib/filterFindings'
import type { Finding, Severity } from '@/types/findings'

const a: Finding = {
  check_name: 'check-1',
  severity: 'Critical',
  file_path: 'src/auth.rs',
  line: 10,
  function_name: 'login',
  description: 'Auth issue',
}

const b: Finding = {
  check_name: 'check-2',
  severity: 'High',
  file_path: 'src/token.rs',
  line: 20,
  function_name: 'transfer',
  description: 'Integer overflow',
}

const c: Finding = {
  check_name: 'check-3',
  severity: 'Medium',
  file_path: 'src/auth.rs',
  line: 30,
  function_name: 'verify',
  description: 'Logic issue',
}

const d: Finding = {
  check_name: 'check-4',
  severity: 'High',
  file_path: 'src/utils.rs',
  line: 40,
  function_name: 'parse',
  description: 'Panic hazard',
}

const findings = [a, b, c, d]

const allSeverities = new Set<Severity>(['Critical', 'High', 'Medium', 'Low', 'Info'])

function defaultFilters(overrides?: Partial<FilterState>): FilterState {
  return { severities: allSeverities, fileFilter: '', showMuted: false, ...overrides }
}

it('returns all findings with default filters', () => {
  expect(filterFindings(findings, defaultFilters())).toEqual(findings)
})

it('filters by single severity', () => {
  const result = filterFindings(findings, defaultFilters({ severities: new Set<Severity>(['High']) }))
  expect(result).toEqual([b, d])
})

it('filters by multiple severities', () => {
  const result = filterFindings(findings, defaultFilters({ severities: new Set<Severity>(['Critical', 'Medium']) }))
  expect(result).toEqual([a, c])
})

it('returns empty when severity set is empty', () => {
  const result = filterFindings(findings, defaultFilters({ severities: new Set<Severity>() }))
  expect(result).toEqual([])
})

it('filters by file path (case-insensitive)', () => {
  const result = filterFindings(findings, defaultFilters({ fileFilter: 'Token' }))
  expect(result).toEqual([b])
})

it('returns all when file filter matches everything', () => {
  const result = filterFindings(findings, defaultFilters({ fileFilter: 'src' }))
  expect(result).toEqual(findings)
})

it('filters by file path combined with severity', () => {
  const result = filterFindings(
    findings,
    defaultFilters({ severities: new Set<Severity>(['High']), fileFilter: 'token' }),
  )
  expect(result).toEqual([b])
})

it('hides muted findings when showMuted is false', () => {
  const isMutedFn = (f: Finding) => f.file_path === 'src/utils.rs'
  const result = filterFindings(findings, defaultFilters({ showMuted: false }), isMutedFn)
  expect(result).toEqual([a, b, c])
})

it('shows muted findings when showMuted is true', () => {
  const isMutedFn = (f: Finding) => f.file_path === 'src/utils.rs'
  const result = filterFindings(findings, defaultFilters({ showMuted: true }), isMutedFn)
  expect(result).toEqual(findings)
})

it('combines all filter dimensions', () => {
  const isMutedFn = (f: Finding) => f.check_name === 'check-2'
  const result = filterFindings(
    findings,
    {
      severities: new Set<Severity>(['Critical', 'High', 'Medium']),
      fileFilter: 'auth',
      showMuted: false,
    },
    isMutedFn,
  )
  expect(result).toEqual([a, c])
})

it('returns empty when no findings match', () => {
  const result = filterFindings(findings, defaultFilters({ fileFilter: 'nonexistent' }))
  expect(result).toEqual([])
})
