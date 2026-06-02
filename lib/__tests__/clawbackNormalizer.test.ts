import { describe, it, expect } from 'vitest'
import {
  buildSummary,
  parseEnforcementEvent,
  normalizeEnforcementEvents,
} from '../clawbackNormalizer'
import type { RawEnforcementEvent } from '../clawbackNormalizer'

const baseEvent: RawEnforcementEvent = {
  action: 'clawback',
  issuer: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  from: 'GXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGH',
  amount: '2500',
  asset_name: 'tokenized treasury notes',
}

describe('buildSummary', () => {
  it('produces the canonical clawback sentence', () => {
    const summary = buildSummary(
      'clawback',
      'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      'GXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGH',
      '2500',
      'tokenized treasury notes',
    )
    expect(summary).toContain('executed a regulatory clawback of')
    expect(summary).toContain('2,500')
    expect(summary).toContain('tokenized treasury notes')
    expect(summary).toContain('from address')
  })

  it('uses "froze the account holding" for freeze action', () => {
    const summary = buildSummary('freeze', 'GABC...', 'GXYZ...', '1000', 'real estate tokens')
    expect(summary).toContain('froze the account holding')
    expect(summary).toContain('at address')
  })

  it('uses "unfroze the account holding" for unfreeze action', () => {
    const summary = buildSummary('unfreeze', 'GABC...', 'GXYZ...', '1000', 'real estate tokens')
    expect(summary).toContain('unfroze the account holding')
  })

  it('appends reference when provided', () => {
    const summary = buildSummary('clawback', 'GABC...', 'GXYZ...', '500', 'bonds', 'CASE-2024-001')
    expect(summary).toContain('Reference: CASE-2024-001')
  })

  it('formats large amounts with thousands separators', () => {
    const summary = buildSummary('clawback', 'GABC...', 'GXYZ...', '1000000', 'tokens')
    expect(summary).toContain('1,000,000')
  })

  it('falls back to raw amount string for non-numeric amounts', () => {
    const summary = buildSummary('clawback', 'GABC...', 'GXYZ...', 'N/A', 'tokens')
    expect(summary).toContain('N/A')
  })

  it('truncates long addresses', () => {
    const longAddr = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const summary = buildSummary('clawback', longAddr, longAddr, '100', 'tokens')
    expect(summary).toContain('GABC...WXYZ')
  })
})

describe('parseEnforcementEvent', () => {
  it('parses a valid clawback event', () => {
    const result = parseEnforcementEvent(baseEvent)
    expect(result).not.toBeNull()
    expect(result!.action).toBe('clawback')
    expect(result!.summary).toContain('executed a regulatory clawback of')
    expect(result!.summary).toContain('2,500')
    expect(result!.summary).toContain('tokenized treasury notes')
  })

  it('normalises action aliases (claw_back → clawback)', () => {
    const result = parseEnforcementEvent({ ...baseEvent, action: 'claw_back' })
    expect(result!.action).toBe('clawback')
  })

  it('normalises force_transfer alias (forcetransfer)', () => {
    const result = parseEnforcementEvent({ ...baseEvent, action: 'forcetransfer' })
    expect(result!.action).toBe('force_transfer')
  })

  it('normalises regulatory_seizure alias (seizure)', () => {
    const result = parseEnforcementEvent({ ...baseEvent, action: 'seizure' })
    expect(result!.action).toBe('regulatory_seizure')
  })

  it('returns null for unrecognised action', () => {
    const result = parseEnforcementEvent({ ...baseEvent, action: 'unknown_action' })
    expect(result).toBeNull()
  })

  it('preserves optional fields (timestamp, reference)', () => {
    const result = parseEnforcementEvent({
      ...baseEvent,
      timestamp: '2024-01-15T10:00:00Z',
      reference: 'REG-001',
    })
    expect(result!.timestamp).toBe('2024-01-15T10:00:00Z')
    expect(result!.reference).toBe('REG-001')
    expect(result!.summary).toContain('Reference: REG-001')
  })

  it('is case-insensitive for action names', () => {
    const result = parseEnforcementEvent({ ...baseEvent, action: 'CLAWBACK' })
    expect(result!.action).toBe('clawback')
  })
})

describe('normalizeEnforcementEvents', () => {
  it('normalises an array of mixed events', () => {
    const events: RawEnforcementEvent[] = [
      { ...baseEvent, action: 'clawback' },
      { ...baseEvent, action: 'freeze' },
      { ...baseEvent, action: 'burn_from' },
    ]
    const result = normalizeEnforcementEvents(events)
    expect(result).toHaveLength(3)
    expect(result[0].action).toBe('clawback')
    expect(result[1].action).toBe('freeze')
    expect(result[2].action).toBe('burn_from')
  })

  it('silently drops events with unrecognised actions', () => {
    const events: RawEnforcementEvent[] = [
      { ...baseEvent, action: 'clawback' },
      { ...baseEvent, action: 'not_a_real_action' },
      { ...baseEvent, action: 'freeze' },
    ]
    const result = normalizeEnforcementEvents(events)
    expect(result).toHaveLength(2)
  })

  it('returns empty array for empty input', () => {
    expect(normalizeEnforcementEvents([])).toEqual([])
  })

  it('each event has a non-empty summary', () => {
    const events: RawEnforcementEvent[] = [
      { ...baseEvent, action: 'clawback' },
      { ...baseEvent, action: 'regulatory_seizure' },
    ]
    const result = normalizeEnforcementEvents(events)
    result.forEach(e => expect(e.summary.length).toBeGreaterThan(0))
  })
})
