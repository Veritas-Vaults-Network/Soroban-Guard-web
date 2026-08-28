import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, GET } from '../download/route'
import type { Finding } from '@/types/findings'

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
]

describe('Export Download API Route (/api/export/download)', () => {
  describe('POST /api/export/download', () => {
    it('returns SARIF file with Content-Disposition header', async () => {
      const req = new NextRequest('http://localhost:3000/api/export/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'sarif',
          findings: mockFindings,
          contractId: 'C123456789',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('application/sarif+json')
      expect(res.headers.get('Content-Disposition')).toContain('attachment; filename=')
      expect(res.headers.get('Content-Disposition')).toContain('.sarif')

      const text = await res.text()
      const parsed = JSON.parse(text)
      expect(parsed.version).toBe('2.1.0')
      expect(parsed.runs[0].results).toHaveLength(1)
    })

    it('returns JSON format when requested', async () => {
      const req = new NextRequest('http://localhost:3000/api/export/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'json',
          findings: mockFindings,
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('application/json')
      expect(res.headers.get('Content-Disposition')).toContain('.json')

      const text = await res.text()
      const parsed = JSON.parse(text)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed[0].check_name).toBe('missing-require-auth')
    })

    it('returns CSV format when requested', async () => {
      const req = new NextRequest('http://localhost:3000/api/export/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'csv',
          findings: mockFindings,
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('text/csv')
      expect(res.headers.get('Content-Disposition')).toContain('.csv')

      const text = await res.text()
      expect(text).toContain('"Check Name","Severity","File","Line","Function","Description","Remediation"')
      expect(text).toContain('"missing-require-auth"')
    })

    it('handles empty findings array properly', async () => {
      const req = new NextRequest('http://localhost:3000/api/export/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'sarif',
          findings: [],
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const text = await res.text()
      const parsed = JSON.parse(text)
      expect(parsed.runs[0].results).toHaveLength(0)
    })

    it('returns 400 for unsupported format', async () => {
      const req = new NextRequest('http://localhost:3000/api/export/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'unsupported_format',
          findings: mockFindings,
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('Unsupported export format')
    })
  })

  describe('GET /api/export/download', () => {
    it('returns 400 for unsupported format on GET', async () => {
      const req = new NextRequest('http://localhost:3000/api/export/download?format=pdf')
      const res = await GET(req)
      expect(res.status).toBe(400)
    })

    it('generates SARIF file when requested via query params', async () => {
      const req = new NextRequest('http://localhost:3000/api/export/download?format=sarif&contractId=TEST_CONTRACT')
      const res = await GET(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('application/sarif+json')
      expect(res.headers.get('Content-Disposition')).toContain('attachment; filename=')
      expect(res.headers.get('Content-Disposition')).toContain('.sarif')
    })
  })
})
