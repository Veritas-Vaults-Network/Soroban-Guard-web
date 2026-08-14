import { calculateScore, SCORE_VERSION } from './score'
import type { Finding } from '@/types/findings'

const f = (severity: Finding['severity']): Finding => ({
  check_name: 'x',
  severity,
  file_path: 'src/lib.rs',
  line: 1,
  function_name: 'fn',
  description: '',
})

test('no findings — returns 100', () => {
  expect(calculateScore([])).toBe(100)
})

test('single Critical — 100 * e^(-20/200) ≈ 90', () => {
  expect(calculateScore([f('Critical')])).toBe(90)
})

test('all Critical — score differentiates severity at low end', () => {
  // 5 Critical → penalty 100 → 100 * e^(-0.5) ≈ 61
  expect(calculateScore(Array(5).fill(f('Critical')))).toBe(61)
  // 10 Critical → penalty 200 → 100 * e^(-1) ≈ 37
  expect(calculateScore(Array(10).fill(f('Critical')))).toBe(37)
  // 50 Critical → penalty 1000 → 100 * e^(-5) ≈ 1
  expect(calculateScore(Array(50).fill(f('Critical')))).toBe(1)
  // 100 Critical → penalty 2000 → 100 * e^(-10) ≈ 0
  expect(calculateScore(Array(100).fill(f('Critical')))).toBe(0)
})

test('5 Critical vs 50 Critical are distinguishable', () => {
  const five = calculateScore(Array(5).fill(f('Critical')))
  const fifty = calculateScore(Array(50).fill(f('Critical')))
  expect(five).toBeGreaterThan(fifty)
  expect(five).toBeGreaterThan(0)
  expect(fifty).toBeGreaterThan(0)
})

test('mixed severities — correctly weighted sum', () => {
  // 1 Critical(20) + 1 High(15) + 1 Medium(7) + 1 Low(2) = 44
  // 100 * e^(-44/200) = 100 * e^(-0.22) ≈ 80
  const findings = [f('Critical'), f('High'), f('Medium'), f('Low')]
  expect(calculateScore(findings)).toBe(80)
})

test('Info findings contribute zero penalty', () => {
  expect(calculateScore(Array(10).fill(f('Info')))).toBe(100)
})

test('score never exceeds 100', () => {
  expect(calculateScore([])).toBeLessThanOrEqual(100)
})

test('score is always non-negative', () => {
  const pathological = Array(200).fill(f('Critical'))
  expect(calculateScore(pathological)).toBeGreaterThanOrEqual(0)
})

test('monotonically decreases with more findings', () => {
  const scores = [0, 1, 2, 5, 10, 20, 50].map(
    n => calculateScore(Array(n).fill(f('Critical'))),
  )
  for (let i = 1; i < scores.length; i++) {
    expect(scores[i]).toBeLessThan(scores[i - 1])
  }
})

test('SCORE_VERSION is exported', () => {
  expect(typeof SCORE_VERSION).toBe('number')
  expect(SCORE_VERSION).toBeGreaterThanOrEqual(2)
})
