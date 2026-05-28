import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST, GET } from '../route'
import { NextRequest } from 'next/server'
import type { Finding } from '@/types/findings'

describe('/api/results', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockFinding: Finding = {
    check_name: 'test_check',
    severity: 'High',
    file_path: 'test.rs',
    line: 10,
    function_name: 'test_func',
    description: 'Test description'
  }

  describe('POST handler', () => {
    it('stores findings and returns id', async () => {
      const findings = [mockFinding]
      const req = new NextRequest('http://localhost:3000/api/results', {
        method: 'POST',
        body: JSON.stringify({ findings })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBeDefined()
      expect(typeof data.id).toBe('string')
      expect(data.id.length).toBe(6)
    })

    it('returns error for invalid payload without findings array', async () => {
      const req = new NextRequest('http://localhost:3000/api/results', {
        method: 'POST',
        body: JSON.stringify({ notFindings: [] })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid payload')
    })

    it('returns error for non-array findings', async () => {
      const req = new NextRequest('http://localhost:3000/api/results', {
        method: 'POST',
        body: JSON.stringify({ findings: 'not an array' })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid payload')
    })

    it('returns error for malformed JSON', async () => {
      const req = new NextRequest('http://localhost:3000/api/results', {
        method: 'POST',
        body: 'invalid json {'
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad request')
    })

    it('stores multiple findings in one request', async () => {
      const findings = [
        mockFinding,
        { ...mockFinding, check_name: 'check2', line: 20 }
      ]

      const req = new NextRequest('http://localhost:3000/api/results', {
        method: 'POST',
        body: JSON.stringify({ findings })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBeDefined()
    })
  })

  describe('GET handler', () => {
    it('returns error for missing id parameter', async () => {
      const req = new NextRequest('http://localhost:3000/api/results')

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing id')
    })

    it('returns error for non-existent id', async () => {
      const req = new NextRequest('http://localhost:3000/api/results?id=nonexistent')

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not found')
    })

    it('retrieves stored findings with valid id', async () => {
      const findings = [mockFinding]

      const postReq = new NextRequest('http://localhost:3000/api/results', {
        method: 'POST',
        body: JSON.stringify({ findings })
      })

      const postResponse = await POST(postReq)
      const postData = await postResponse.json()
      const id = postData.id

      const getReq = new NextRequest(`http://localhost:3000/api/results?id=${id}`)
      const getResponse = await GET(getReq)
      const getData = await getResponse.json()

      expect(getResponse.status).toBe(200)
      expect(getData.findings).toEqual(findings)
    })

    it('returns 410 Gone for expired entries', async () => {
      const findings = [mockFinding]

      const postReq = new NextRequest('http://localhost:3000/api/results', {
        method: 'POST',
        body: JSON.stringify({ findings })
      })

      const postResponse = await POST(postReq)
      const postData = await postResponse.json()
      const id = postData.id

      // Travel to future (mock Date.now to simulate expiry)
      const originalNow = Date.now
      const TTL_MS = 30 * 24 * 60 * 60 * 1000
      vi.spyOn(Date, 'now').mockReturnValue(originalNow() + TTL_MS + 1000)

      const getReq = new NextRequest(`http://localhost:3000/api/results?id=${id}`)
      const getResponse = await GET(getReq)
      const getData = await getResponse.json()

      expect(getResponse.status).toBe(410)
      expect(getData.error).toBe('Expired')

      Date.now = originalNow
    })
  })
})
