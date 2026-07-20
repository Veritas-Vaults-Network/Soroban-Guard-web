import { mute, unmute, isMuted } from '@/lib/mutedFindings'
import type { Finding } from '@/types/findings'

const f: Finding = {
  check_name: 'unchecked-auth',
  severity: 'High',
  file_path: 'src/lib.rs',
  line: 42,
  function_name: 'transfer',
  description: 'Auth not verified.',
}

const other: Finding = { ...f, check_name: 'integer-overflow', line: 10 }

beforeEach(() => localStorage.clear())

it('isMuted returns false by default', () => {
  expect(isMuted(f)).toBe(false)
})

it('mute → isMuted returns true', () => {
  mute(f)
  expect(isMuted(f)).toBe(true)
})

it('mute → unmute → isMuted returns false', () => {
  mute(f)
  unmute(f)
  expect(isMuted(f)).toBe(false)
})

it('unmuting a never-muted finding is a no-op', () => {
  unmute(f)
  expect(isMuted(f)).toBe(false)
})

it('muting one finding does not affect another', () => {
  mute(f)
  expect(isMuted(other)).toBe(false)
})

it('persists muted key in localStorage', () => {
  mute(f)
  const stored = JSON.parse(localStorage.getItem('sg_muted_findings')!)
  expect(stored).toContain('unchecked-auth:src/lib.rs:transfer')
})

it('mute survives line-number shift (same function, different line)', () => {
  mute(f)
  const shifted = { ...f, line: 99 }
  expect(isMuted(shifted)).toBe(true)
})
