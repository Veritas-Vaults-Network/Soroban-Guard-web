import { filterFindings, type FilterState } from '../filterFindings'
import { groupByFunction, groupByFile } from '../groupFindings'
import { mute, unmute, isMuted } from '../mutedFindings'
import type { Finding, Severity } from '@/types/findings'

// Realistic fixtures
const finding1: Finding = {
  check_name: 'unchecked-auth',
  severity: 'High',
  file_path: 'src/lib.rs',
  line: 12,
  function_name: 'transfer',
  description: 'Missing signature verification',
}

const finding2: Finding = {
  check_name: 'integer-overflow',
  severity: 'Critical',
  file_path: 'src/token.rs',
  line: 45,
  function_name: 'mint',
  description: 'Potential overflow in balance addition',
}

const finding3: Finding = {
  check_name: 'reentrancy',
  severity: 'High',
  file_path: 'src/lib.rs',
  line: 88,
  function_name: 'withdraw',
  description: 'External call before state update',
}

const finding4: Finding = {
  check_name: 'unused-variable',
  severity: 'Info',
  file_path: 'src/utils.rs',
  line: 5,
  function_name: 'helper_func',
  description: 'Variable is never used',
}

const finding5: Finding = {
  check_name: 'unchecked-auth',
  severity: 'High',
  file_path: 'src/token.rs',
  line: 60,
  function_name: 'transfer',
  description: 'Missing authority check in token transfer',
}

const fixtures = [finding1, finding2, finding3, finding4, finding5]

const allSeverities = new Set<Severity>(['Critical', 'High', 'Medium', 'Low', 'Info'])

function defaultFilters(overrides?: Partial<FilterState>): FilterState {
  return {
    severities: allSeverities,
    fileFilter: '',
    showMuted: false,
    ...overrides,
  }
}

describe('Findings Composition Integration Tests', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  // ✓ filter only
  it('handles filtering only correctly', () => {
    const filters = defaultFilters({ severities: new Set<Severity>(['High']) })
    const filtered = filterFindings(fixtures, filters)
    expect(filtered).toHaveLength(3)
    expect(filtered).toContain(finding1)
    expect(filtered).toContain(finding3)
    expect(filtered).toContain(finding5)
  })

  // ✓ mute only
  it('handles muting only correctly (with default filter settings)', () => {
    // With showMuted: false (default), muted findings should be hidden
    const isMutedFn = (f: Finding) => f.check_name === 'unchecked-auth'
    const filtered = filterFindings(fixtures, defaultFilters({ showMuted: false }), isMutedFn)
    expect(filtered).toHaveLength(3)
    expect(filtered).toContain(finding2)
    expect(filtered).toContain(finding3)
    expect(filtered).toContain(finding4)
  })

  // ✓ group only
  it('handles grouping only correctly', () => {
    const groupedByFunc = groupByFunction(fixtures)
    expect(Object.keys(groupedByFunc)).toHaveLength(4)
    expect(groupedByFunc['transfer']).toHaveLength(2)
    expect(groupedByFunc['mint']).toHaveLength(1)

    const groupedByFile = groupByFile(fixtures)
    expect(Object.keys(groupedByFile)).toHaveLength(3)
    expect(groupedByFile['src/lib.rs']).toHaveLength(2)
    expect(groupedByFile['src/token.rs']).toHaveLength(2)
  })

  // ✓ filter -> group
  it('composes filter -> group correctly', () => {
    const filters = defaultFilters({ severities: new Set<Severity>(['High']) })
    const filtered = filterFindings(fixtures, filters)
    const grouped = groupByFunction(filtered)

    expect(Object.keys(grouped)).toHaveLength(2) // transfer, withdraw
    expect(grouped['transfer']).toHaveLength(2)
    expect(grouped['withdraw']).toHaveLength(1)
  })

  // ✓ mute -> group
  it('composes mute -> group correctly', () => {
    const isMutedFn = (f: Finding) => f.file_path === 'src/lib.rs'
    const filtered = filterFindings(fixtures, defaultFilters({ showMuted: false }), isMutedFn)
    const grouped = groupByFile(filtered)

    expect(Object.keys(grouped)).toHaveLength(2) // src/token.rs, src/utils.rs
    expect(grouped['src/lib.rs']).toBeUndefined()
    expect(grouped['src/token.rs']).toHaveLength(2)
  })

  // ✓ filter -> mute -> group
  it('composes filter -> mute -> group correctly', () => {
    const filters = defaultFilters({
      severities: new Set<Severity>(['High', 'Critical']),
      showMuted: false,
    })
    // Mute transfer findings
    const isMutedFn = (f: Finding) => f.function_name === 'transfer'

    const filtered = filterFindings(fixtures, filters, isMutedFn)
    const grouped = groupByFunction(filtered)

    // finding1 and finding5 (transfer) should be filtered out because they are muted.
    // finding2 (mint) is Critical. finding3 (withdraw) is High.
    expect(Object.keys(grouped)).toHaveLength(2) // mint, withdraw
    expect(grouped['transfer']).toBeUndefined()
    expect(grouped['mint']).toHaveLength(1)
    expect(grouped['withdraw']).toHaveLength(1)
  })

  // ✓ mute -> filter -> group
  it('composes mute -> filter -> group correctly', () => {
    // If showMuted is true, we display muted findings as well.
    const filters = defaultFilters({
      severities: new Set<Severity>(['High']),
      showMuted: true,
    })
    const isMutedFn = (f: Finding) => f.check_name === 'unchecked-auth'

    const filtered = filterFindings(fixtures, filters, isMutedFn)
    const grouped = groupByFunction(filtered)

    // Should include high severity findings even if they are muted (finding1, finding3, finding5)
    expect(Object.keys(grouped)).toHaveLength(2) // transfer, withdraw
    expect(grouped['transfer']).toHaveLength(2)
    expect(grouped['withdraw']).toHaveLength(1)
  })

  // ✓ empty result
  it('handles empty results correctly', () => {
    const filters = defaultFilters({ severities: new Set<Severity>() })
    const filtered = filterFindings(fixtures, filters)
    expect(filtered).toHaveLength(0)

    const grouped = groupByFunction(filtered)
    expect(grouped).toEqual({})
  })

  // ✓ empty group
  it('handles empty group correctly', () => {
    const grouped = groupByFunction([])
    expect(grouped).toEqual({})
  })

  // ✓ fully muted group
  it('handles a fully muted group correctly when showMuted is false', () => {
    // Mute all findings in src/lib.rs (finding1, finding3)
    const isMutedFn = (f: Finding) => f.file_path === 'src/lib.rs'
    const filtered = filterFindings(fixtures, defaultFilters({ showMuted: false }), isMutedFn)
    const grouped = groupByFile(filtered)

    expect(grouped['src/lib.rs']).toBeUndefined()
  })

  // ✓ partially muted group
  it('handles a partially muted group correctly when showMuted is false', () => {
    // Mute finding1 (transfer, src/lib.rs) but not finding3 (withdraw, src/lib.rs)
    const isMutedFn = (f: Finding) => f.check_name === 'unchecked-auth' && f.file_path === 'src/lib.rs'
    const filtered = filterFindings(fixtures, defaultFilters({ showMuted: false }), isMutedFn)
    const grouped = groupByFile(filtered)

    expect(grouped['src/lib.rs']).toHaveLength(1)
    expect(grouped['src/lib.rs'][0]).toBe(finding3)
  })

  // ✓ stable group counts
  it('maintains stable group counts across repeated calls', () => {
    const run = () => {
      const filtered = filterFindings(fixtures, defaultFilters())
      const grouped = groupByFunction(filtered)
      return {
        transfer: grouped['transfer']?.length || 0,
        mint: grouped['mint']?.length || 0,
        withdraw: grouped['withdraw']?.length || 0,
      }
    }

    const first = run()
    for (let i = 0; i < 5; i++) {
      expect(run()).toEqual(first)
    }
  })

  // ✓ stable ordering
  it('maintains stable ordering of grouped keys', () => {
    const getKeys = () => {
      const filtered = filterFindings(fixtures, defaultFilters())
      const grouped = groupByFunction(filtered)
      return Object.keys(grouped).sort()
    }

    const firstKeys = getKeys()
    for (let i = 0; i < 5; i++) {
      expect(getKeys()).toEqual(firstKeys)
    }
  })

  // Test integration with the actual localStorage implementation of mutedFindings
  if (typeof window !== 'undefined' || typeof localStorage !== 'undefined') {
    it('integrates correctly with the real mute/unmute/isMuted local storage utilities', () => {
      // Initially not muted
      expect(isMuted(finding1)).toBe(false)

      // Mute finding1
      mute(finding1)
      expect(isMuted(finding1)).toBe(true)

      // Filtering hides it
      let filtered = filterFindings(fixtures, defaultFilters({ showMuted: false }))
      expect(filtered).not.toContain(finding1)

      // Unmute finding1
      unmute(finding1)
      expect(isMuted(finding1)).toBe(false)

      filtered = filterFindings(fixtures, defaultFilters({ showMuted: false }))
      expect(filtered).toContain(finding1)
    })
  }
})
