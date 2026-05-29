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

export function removeSchedule(contractId: string, network: string): void {
  const schedules = load().filter(s => !(s.contractId === contractId && s.network === network))
  save(schedules)
}

export function getSchedule(contractId: string, network: string): ScheduledScan | null {
  return load().find(s => s.contractId === contractId && s.network === network) ?? null
}

export function getAllSchedules(): ScheduledScan[] {
  return load()
}

export function markRan(contractId: string, network: string): void {
  const schedules = load()
  const entry = schedules.find(s => s.contractId === contractId && s.network === network)
  if (entry) {
    entry.lastRun = new Date().toISOString()
    save(schedules)
  }
}

export function getDueScans(): ScheduledScan[] {
  const now = Date.now()
  return load().filter(s => {
    if (!s.lastRun) return true
    const last = new Date(s.lastRun).getTime()
    const intervalMs = s.interval === 'daily' ? 86_400_000 : 7 * 86_400_000
    return now - last >= intervalMs
  })
}
