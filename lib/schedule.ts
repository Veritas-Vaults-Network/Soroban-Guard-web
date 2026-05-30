const STORAGE_KEY = 'sg_scheduled_scans'

export type ScheduleInterval = 'daily' | 'weekly'

export interface ScheduledScan {
  contractId: string
  network: string
  interval: ScheduleInterval
  lastRun: string | null // ISO string
}

function load(): ScheduledScan[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(schedules: ScheduledScan[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules))
  } catch {
    // Silently fail
  }
}

/**
 * Add or update a scheduled rescan for a contract.
 * @param contractId - Contract ID or source to schedule
 * @param network - Network name (e.g. 'testnet')
 * @param interval - Rescan frequency
 */
export function addSchedule(contractId: string, network: string, interval: ScheduleInterval): void {
  const schedules = load()
  const existing = schedules.findIndex(s => s.contractId === contractId && s.network === network)
  if (existing >= 0) {
    schedules[existing].interval = interval
  } else {
    schedules.push({ contractId, network, interval, lastRun: null })
  }
  save(schedules)
}

/**
 * Remove a scheduled rescan.
 * @param contractId - Contract ID or source
 * @param network - Network name
 */
export function removeSchedule(contractId: string, network: string): void {
  const schedules = load().filter(s => !(s.contractId === contractId && s.network === network))
  save(schedules)
}

/**
 * Get the schedule for a specific contract and network.
 * @param contractId - Contract ID or source
 * @param network - Network name
 * @returns The scheduled scan entry, or null if not scheduled
 */
export function getSchedule(contractId: string, network: string): ScheduledScan | null {
  return load().find(s => s.contractId === contractId && s.network === network) ?? null
}

/**
 * Get all scheduled scans.
 * @returns Array of all scheduled scan entries
 */
export function getAllSchedules(): ScheduledScan[] {
  return load()
}

/**
 * Record that a scheduled scan was just executed.
 * @param contractId - Contract ID or source
 * @param network - Network name
 */
export function markRan(contractId: string, network: string): void {
  const schedules = load()
  const entry = schedules.find(s => s.contractId === contractId && s.network === network)
  if (entry) {
    entry.lastRun = new Date().toISOString()
    save(schedules)
  }
}

/**
 * Get all scheduled scans that are due to run.
 * @returns Array of scheduled scans whose interval has elapsed
 */
export function getDueScans(): ScheduledScan[] {
  const now = Date.now()
  return load().filter(s => {
    if (!s.lastRun) return true
    const last = new Date(s.lastRun).getTime()
    const intervalMs = s.interval === 'daily' ? 86_400_000 : 7 * 86_400_000
    return now - last >= intervalMs
  })
}
