import type { Finding, Severity } from '@/types/findings'
import { isMuted } from './mutedFindings'

export interface FilterState {
  severities: Set<Severity>
  fileFilter: string
  showMuted: boolean
}

export function filterFindings(
  findings: Finding[],
  filters: FilterState,
  isMutedFn: (f: Finding) => boolean = isMuted,
): Finding[] {
  const file = filters.fileFilter.trim().toLowerCase()
  return findings.filter(f => {
    if (!filters.severities.has(f.severity)) return false
    if (file && !f.file_path.toLowerCase().includes(file)) return false
    if (!filters.showMuted && isMutedFn(f)) return false
    return true
  })
}
