import { describe, expect, it } from 'vitest'
import type { Finding } from '@/types/findings'
import { serializeJson } from '@/lib/export/json'

const mockFindings: Finding[] = [
  {
    check_name: 'missing-require-auth',
    severity: 'Critical',
    file_path: 'src/lib.rs',
    line: 42,
    function_name: 'mint_tokens',
    description: 'Method writes to storage without auth check.',
  },
]

describe('JSON Serializer', () => {
  it('serializes raw findings array by default', () => {
    const json = serializeJson(mockFindings)
    const parsed = JSON.parse(json)

    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].check_name).toBe('missing-require-auth')
  })

  it('serializes with wrapper metadata when requested', () => {
    const json = serializeJson(mockFindings, { wrapper: true, contractId: 'CC12345' })
    const parsed = JSON.parse(json)

    expect(parsed.generator).toBe('Soroban Guard')
    expect(parsed.contractId).toBe('CC12345')
    expect(parsed.totalFindings).toBe(1)
    expect(parsed.findings).toHaveLength(1)
  })

  it('handles empty results set', () => {
    const json = serializeJson([])
    expect(JSON.parse(json)).toEqual([])
  })
})
