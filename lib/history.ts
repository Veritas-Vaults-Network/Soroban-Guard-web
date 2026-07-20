import type { ContractScanRecord } from '@/types/stellar'
import { SCORE_VERSION } from '@/lib/score'

const STORAGE_KEY = 'sg_scan_history'

/**
 * Retrieve all scan history records from localStorage.
 * @returns Array of all scan records, or empty array on error
 */
export function getAllScanHistory(): ContractScanRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ContractScanRecord[]
  } catch {
    return []
  }
}

/**
 * Remove all scan history from localStorage.
 */
export function clearScanHistory(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Silently fail
  }
}

/**
 * Retrieve scan history filtered by a specific wallet public key.
 * @param publicKey - Stellar public key (G-address) to filter by
 * @returns Array of matching scan records
 */
export function getScanHistory(publicKey: string): ContractScanRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const records = JSON.parse(raw) as ContractScanRecord[]
    return records.filter(r => r.publicKey === publicKey)
  } catch {
    return []
  }
}

/**
 * Find a single scan record by its ID.
 * @param id - Record ID to look up
 * @returns The matching record, or null if not found
 */
export function getById(id: string): ContractScanRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const records = JSON.parse(raw) as ContractScanRecord[]
    return records.find(r => r.id === id) || null
  } catch {
    return null
  }
}

/**
 * Persist a new scan record to localStorage (capped at 50 entries).
 * @param publicKey - Wallet public key that initiated the scan
 * @param contractId - Scanned contract ID
 * @param network - Network name (e.g. 'testnet')
 * @param findings - Array of findings from the scan
 * @param score - Optional security score (0-100)
 */
export function addScanRecord(
  publicKey: string,
  contractId: string,
  network: string,
  findings: Array<{ severity: string; check_name: string; description: string; function_name: string; file_path: string; line: number }>,
  score?: number
): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const records = raw ? (JSON.parse(raw) as ContractScanRecord[]) : []

    const counts = { high: 0, medium: 0, low: 0 }
    for (const f of findings) {
      if (f.severity === 'High') counts.high++
      else if (f.severity === 'Medium') counts.medium++
      else if (f.severity === 'Low') counts.low++
    }

    const record: ContractScanRecord = {
      id: Date.now().toString(),
      publicKey,
      contractId,
      network,
      scannedAt: new Date().toISOString(),
      findingCount: findings.length,
      highCount: counts.high,
      mediumCount: counts.medium,
      lowCount: counts.low,
      findings,
      score,
      scoreVersion: SCORE_VERSION,
    }

    records.unshift(record)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50)))
  } catch {
    // Silently fail
  }
}
