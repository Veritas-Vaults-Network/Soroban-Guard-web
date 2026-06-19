export interface RecentScan {
  type: 'code' | 'github' | 'contractId'
  value: string
  timestamp: number
  network?: 'testnet' | 'mainnet' | 'futurenet'
}

const STORAGE_KEY = 'sg_recent_scans'
const PINNED_KEY = 'sg_pinned_scans'
const MAX_RECENTS = 5
const MAX_PINS = 3

/**
 * Add or update a recent scan entry in localStorage.
 * @param type - Input mode used for the scan
 * @param value - The scanned value (URL, contract ID, or code snippet)
 * @param network - Network name (only relevant for contractId type)
 */
export function addRecent(type: RecentScan['type'], value: string, network?: RecentScan['network']): void {
  if (typeof window === 'undefined') return

  try {
    const existing = getRecent()
    const filtered = existing.filter(
      scan => !(scan.type === type && scan.value === value)
    )

    const entry: RecentScan = { type, value, timestamp: Date.now() }
    if (network) entry.network = network

    const updated: RecentScan[] = [entry, ...filtered].slice(0, MAX_RECENTS)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save recent scan:', err)
  }
}

/**
 * Retrieve recent scans from localStorage.
 * @returns Array of recent scan entries, newest first
 */
export function getRecent(): RecentScan[] {
  if (typeof window === 'undefined') return []
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    
    const parsed = JSON.parse(raw) as RecentScan[]
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to load recent scans:', err)
    return []
  }
}

/**
 * Produce a short display label for a recent scan entry.
 * @param scan - The recent scan entry
 * @returns Truncated label string suitable for display in a list
 */
export function truncateLabel(scan: RecentScan): string {
  const maxLen = 40

  if (scan.type === 'contractId') {
    return scan.value.length > maxLen
      ? `${scan.value.slice(0, 20)}...${scan.value.slice(-10)}`
      : scan.value
  }

  if (scan.type === 'github') {
    return scan.value.length > maxLen
      ? `${scan.value.slice(0, maxLen - 3)}...`
      : scan.value
  }

  // For code, show first line or truncated preview
  const firstLine = scan.value.split('\n')[0]
  return firstLine.length > maxLen
    ? `${firstLine.slice(0, maxLen - 3)}...`
    : firstLine
}

/**
 * Remove a specific recent scan entry from localStorage.
 * Also removes the entry from pinned scans if pinned.
 */
export function removeRecent(type: RecentScan['type'], value: string): void {
  if (typeof window === 'undefined') return

  try {
    const updated = getRecent().filter(
      scan => !(scan.type === type && scan.value === value)
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    unpinScan(value)
  } catch (err) {
    console.error('Failed to remove recent scan:', err)
  }
}

/**
 * Retrieve pinned scan values from localStorage.
 * @returns Array of pinned scan value strings
 */
export function getPinned(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(PINNED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Pin a scan by value. No-op if already pinned or MAX_PINS reached.
 */
export function pinScan(value: string): void {
  if (typeof window === 'undefined') return

  try {
    const pinned = getPinned()
    if (pinned.includes(value) || pinned.length >= MAX_PINS) return
    localStorage.setItem(PINNED_KEY, JSON.stringify([...pinned, value]))
  } catch (err) {
    console.error('Failed to pin scan:', err)
  }
}

/**
 * Unpin a scan by value.
 */
export function unpinScan(value: string): void {
  if (typeof window === 'undefined') return

  try {
    const updated = getPinned().filter(v => v !== value)
    localStorage.setItem(PINNED_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to unpin scan:', err)
  }
}
