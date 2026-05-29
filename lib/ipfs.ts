const CID_RE = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{55})$/

export function isValidCid(cid: string): boolean {
  return CID_RE.test(cid.trim())
}

export async function fetchFromIpfs(cid: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const res = await fetch(`https://ipfs.io/ipfs/${encodeURIComponent(cid.trim())}`, {
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`IPFS gateway returned ${res.status}`)
    return await res.text()
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('IPFS fetch timed out after 15 s')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}
