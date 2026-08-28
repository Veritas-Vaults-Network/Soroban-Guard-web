import { describe, expect, it } from 'vitest'
import type { Finding } from '@/types/findings'
import { serializeCsv } from '@/lib/export/csv'

const mockFindings: Finding[] = [
  {
    check_name: 'missing-require-auth',
    severity: 'Critical',
    file_path: 'src/lib.rs',
    line: 42,
    function_name: 'mint_tokens',
    description: 'Method writes to storage without auth check.',
    remediation: 'Add env.require_auth().',
  },
  {
    check_name: 'quotes-and-commas',
    severity: 'High',
    file_path: 'src/special.rs',
    line: 10,
    function_name: 'escape_test',
    description: 'Contains "double quotes", commas, and\nnewlines in description.',
    remediation: 'Handle "special" characters safely.',
  },
]

describe('CSV Serializer', () => {
  it('includes standard headers', () => {
    const csv = serializeCsv([])
    expect(csv).toBe('"Check Name","Severity","File","Line","Function","Description","Remediation"')
  })

  it('serializes finding rows correctly with quoting', () => {
    const csv = serializeCsv(mockFindings)
    const lines = csv.split('\n')

    expect(lines[0]).toBe('"Check Name","Severity","File","Line","Function","Description","Remediation"')
    expect(lines[1]).toBe(
      '"missing-require-auth","Critical","src/lib.rs","42","mint_tokens","Method writes to storage without auth check.","Add env.require_auth()."'
    )
  })

  it('escapes internal quotes and preserves newlines', () => {
    const csv = serializeCsv([mockFindings[1]])
    expect(csv).toContain('""double quotes""')
    expect(csv).toContain('""special""')
  })

  it('handles empty results set', () => {
    const csv = serializeCsv([])
    expect(csv.split('\n')).toHaveLength(1)
  })
})
