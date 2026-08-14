import { diffFindings } from './diffFindings'
import type { Finding } from '@/types/findings'

const createFinding = (overrides: Partial<Finding>): Finding => ({
  check_name: 'unchecked-auth',
  severity: 'High',
  file_path: 'src/lib.rs',
  line: 1,
  function_name: 'transfer',
  description: 'Missing authority check',
  ...overrides,
})

test('identical findings — all unchanged, no added, no resolved', () => {
  const before = [
    createFinding({ check_name: 'auth', line: 10 }),
    createFinding({ check_name: 'overflow', line: 20 }),
  ]
  const after = [
    createFinding({ check_name: 'auth', line: 10 }),
    createFinding({ check_name: 'overflow', line: 20 }),
  ]
  const result = diffFindings(before, after)
  expect(result.added).toHaveLength(0)
  expect(result.resolved).toHaveLength(0)
  expect(result.unchanged).toHaveLength(2)
  expect(result.unchanged[0]).toEqual(after[0])
  expect(result.unchanged[1]).toEqual(after[1])
})

test('shifted line numbers — correctly matches as unchanged', () => {
  const before = [
    createFinding({ check_name: 'auth', line: 10, function_name: 'transfer' }),
  ]
  const after = [
    createFinding({ check_name: 'auth', line: 15, function_name: 'transfer' }),
  ]
  const result = diffFindings(before, after)
  expect(result.added).toHaveLength(0)
  expect(result.resolved).toHaveLength(0)
  expect(result.unchanged).toHaveLength(1)
  // The unchanged entry should contain the updated line number from the 'after' state
  expect(result.unchanged[0].line).toBe(15)
})

test('multiple shifted line numbers — pairs to minimize total distance', () => {
  const before = [
    createFinding({ check_name: 'auth', line: 10, function_name: 'transfer' }),
    createFinding({ check_name: 'auth', line: 20, function_name: 'transfer' }),
  ]
  const after = [
    createFinding({ check_name: 'auth', line: 11, function_name: 'transfer' }),
    createFinding({ check_name: 'auth', line: 22, function_name: 'transfer' }),
  ]
  const result = diffFindings(before, after)
  expect(result.added).toHaveLength(0)
  expect(result.resolved).toHaveLength(0)
  expect(result.unchanged).toHaveLength(2)
  expect(result.unchanged.map(f => f.line)).toEqual([11, 22])
})

test('renamed function containing the same finding — matches correctly by description', () => {
  const before = [
    createFinding({ check_name: 'auth', line: 10, function_name: 'transfer', description: 'Missing sign verification' }),
  ]
  const after = [
    createFinding({ check_name: 'auth', line: 15, function_name: 'transfer_funds', description: 'Missing sign verification' }),
  ]
  const result = diffFindings(before, after)
  expect(result.added).toHaveLength(0)
  expect(result.resolved).toHaveLength(0)
  expect(result.unchanged).toHaveLength(1)
  expect(result.unchanged[0].function_name).toBe('transfer_funds')
  expect(result.unchanged[0].line).toBe(15)
})

test('resolved finding — appears in resolved', () => {
  const before = [
    createFinding({ check_name: 'auth', line: 10 }),
    createFinding({ check_name: 'overflow', line: 20 }),
  ]
  const after = [
    createFinding({ check_name: 'auth', line: 10 }),
  ]
  const result = diffFindings(before, after)
  expect(result.resolved).toHaveLength(1)
  expect(result.resolved[0].check_name).toBe('overflow')
  expect(result.added).toHaveLength(0)
  expect(result.unchanged).toHaveLength(1)
})

test('newly introduced finding — appears in added', () => {
  const before = [
    createFinding({ check_name: 'auth', line: 10 }),
  ]
  const after = [
    createFinding({ check_name: 'auth', line: 10 }),
    createFinding({ check_name: 'overflow', line: 20 }),
  ]
  const result = diffFindings(before, after)
  expect(result.added).toHaveLength(1)
  expect(result.added[0].check_name).toBe('overflow')
  expect(result.resolved).toHaveLength(0)
  expect(result.unchanged).toHaveLength(1)
})

test('reordered findings — result list maintains order corresponding to input arrays', () => {
  const before = [
    createFinding({ check_name: 'auth', line: 10 }),
    createFinding({ check_name: 'overflow', line: 20 }),
  ]
  const after = [
    createFinding({ check_name: 'overflow', line: 20 }),
    createFinding({ check_name: 'auth', line: 10 }),
  ]
  const result = diffFindings(before, after)
  expect(result.unchanged).toHaveLength(2)
  expect(result.unchanged[0].check_name).toBe('overflow')
  expect(result.unchanged[1].check_name).toBe('auth')
})

test('duplicate findings — handles exact duplicate pairs cleanly', () => {
  const before = [
    createFinding({ check_name: 'auth', line: 10 }),
    createFinding({ check_name: 'auth', line: 10 }),
  ]
  const after = [
    createFinding({ check_name: 'auth', line: 10 }),
    createFinding({ check_name: 'auth', line: 10 }),
  ]
  const result = diffFindings(before, after)
  expect(result.unchanged).toHaveLength(2)
  expect(result.added).toHaveLength(0)
  expect(result.resolved).toHaveLength(0)
})

test('duplicate findings — resolved and added duplicate imbalances', () => {
  const before = [
    createFinding({ check_name: 'auth', line: 10 }),
    createFinding({ check_name: 'auth', line: 10 }),
  ]
  const after = [
    createFinding({ check_name: 'auth', line: 10 }),
  ]
  const result = diffFindings(before, after)
  expect(result.unchanged).toHaveLength(1)
  expect(result.resolved).toHaveLength(1)
  expect(result.added).toHaveLength(0)
})

test('findings from multiple files — stays isolated and does not cross-match', () => {
  const before = [
    createFinding({ check_name: 'auth', file_path: 'src/lib.rs', line: 10 }),
  ]
  const after = [
    createFinding({ check_name: 'auth', file_path: 'src/token.rs', line: 10 }),
  ]
  const result = diffFindings(before, after)
  expect(result.resolved).toHaveLength(1)
  expect(result.resolved[0].file_path).toBe('src/lib.rs')
  expect(result.added).toHaveLength(1)
  expect(result.added[0].file_path).toBe('src/token.rs')
  expect(result.unchanged).toHaveLength(0)
})

test('mixed added, resolved, and unchanged findings', () => {
  const before = [
    createFinding({ check_name: 'auth', line: 10 }), // unchanged
    createFinding({ check_name: 'overflow', line: 20 }), // resolved
  ]
  const after = [
    createFinding({ check_name: 'auth', line: 10 }), // unchanged
    createFinding({ check_name: 'reentrancy', line: 30 }), // added
  ]
  const result = diffFindings(before, after)
  expect(result.unchanged).toHaveLength(1)
  expect(result.unchanged[0].check_name).toBe('auth')
  expect(result.resolved).toHaveLength(1)
  expect(result.resolved[0].check_name).toBe('overflow')
  expect(result.added).toHaveLength(1)
  expect(result.added[0].check_name).toBe('reentrancy')
})

test('empty inputs — returns empty lists', () => {
  const result = diffFindings([], [])
  expect(result.added).toHaveLength(0)
  expect(result.resolved).toHaveLength(0)
  expect(result.unchanged).toHaveLength(0)
})

test('randomized input ordering — yields deterministic results', () => {
  const before = [
    createFinding({ check_name: 'auth', line: 10, function_name: 'f1' }),
    createFinding({ check_name: 'overflow', line: 20, function_name: 'f2' }),
    createFinding({ check_name: 'reentrancy', line: 30, function_name: 'f3' }),
  ]
  const after = [
    createFinding({ check_name: 'reentrancy', line: 30, function_name: 'f3' }),
    createFinding({ check_name: 'auth', line: 12, function_name: 'f1' }), // line shifted
  ]

  // Output invariants should be completely deterministic regardless of the order of input items
  const permBefore = [before[2], before[0], before[1]]
  const permAfter = [after[1], after[0]]

  const result1 = diffFindings(before, after)
  const result2 = diffFindings(permBefore, permAfter)

  // Verify finding counts
  expect(result1.unchanged).toHaveLength(2)
  expect(result1.resolved).toHaveLength(1)
  expect(result1.added).toHaveLength(0)

  expect(result2.unchanged).toHaveLength(2)
  expect(result2.resolved).toHaveLength(1)
  expect(result2.added).toHaveLength(0)

  // Invariants checking:
  // unchanged contains auth (shifted to 12) and reentrancy (30)
  const names1 = result1.unchanged.map(f => f.check_name).sort()
  const names2 = result2.unchanged.map(f => f.check_name).sort()
  expect(names1).toEqual(['auth', 'reentrancy'])
  expect(names2).toEqual(['auth', 'reentrancy'])
})
