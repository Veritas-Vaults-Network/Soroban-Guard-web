export interface RecentScan {
  type: 'code' | 'github' | 'contractId'
  value: string
  timestamp: number
}

const STORAGE_KEY = 'sg_recent_scans'
const MAX_RECENTS = 5

export function addRecent(type: RecentScan['type'], value: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const existing = getRecent()
    const filtered = existing.filter(
      scan => !(scan.type === type && scan.value === value)
    )
    
    const updated: RecentScan[] = [
      { type, value, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENTS)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save recent scan:', err)
  }
}

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
