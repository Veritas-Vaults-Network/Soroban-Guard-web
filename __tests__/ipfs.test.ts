import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isValidCid, fetchFromIpfs } from '../lib/ipfs'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('isValidCid', () => {
  it('accepts a valid CIDv0 (Qm…)', () => {
    expect(isValidCid('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')).toBe(true)
  })

  it('accepts a valid CIDv1 (bafy…)', () => {
    expect(
      isValidCid('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'),
    ).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(isValidCid('')).toBe(false)
  })

  it('rejects a random string', () => {
    expect(isValidCid('not-a-cid')).toBe(false)
  })

  it('rejects a CIDv0 that is too short', () => {
    expect(isValidCid('QmShort')).toBe(false)
  })

  it('strips leading/trailing whitespace before validating', () => {
    expect(isValidCid('  QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG  ')).toBe(true)
  })
})

describe('fetchFromIpfs', () => {
  it('returns text content on a successful fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '{"hello":"world"}',
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchFromIpfs('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')
    expect(result).toBe('{"hello":"world"}')
  })

  it('calls the ipfs.io gateway with the encoded CID', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => 'data' })
    vi.stubGlobal('fetch', fetchMock)

    const cid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
    await fetchFromIpfs(cid)

    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://ipfs.io/ipfs/${encodeURIComponent(cid)}`,
    )
  })

  it('throws when gateway returns non-ok status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchFromIpfs('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'),
    ).rejects.toThrow('IPFS gateway returned 404')
  })

  it('throws a timeout error when fetch is aborted', async () => {
    const fetchMock = vi.fn().mockRejectedValue(
      Object.assign(new DOMException('Aborted', 'AbortError')),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchFromIpfs('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'),
    ).rejects.toThrow('IPFS fetch timed out after 15 s')
  })

  it('re-throws non-abort errors from fetch', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network failure'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchFromIpfs('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'),
    ).rejects.toThrow('network failure')
  })
})
